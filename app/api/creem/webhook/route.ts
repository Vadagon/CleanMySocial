import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CREEM } from "@/lib/site";
import { getProduct } from "@/lib/products";
import { revokeLicense } from "@/lib/license";
import { fulfillPaidProduct } from "@/lib/fulfillment";

// Creem webhooks are verified against the raw request body, so this route must
// run on the Node.js runtime (not edge) and read the body as text.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creem signs the raw request body with HMAC-SHA256 using the webhook secret
 * (Developers → Webhooks) and sends it in the `creem-signature` header.
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!CREEM.webhookSecret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", CREEM.webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

type Meta =
  | {
      key?: string;
      extension?: string;
      plan?: string;
      email?: string;
      product_id?: string;
      entitlements?: string;
    }
  | null
  | undefined;

// Creem nests the resource (checkout / subscription / order) under `object`.
// Shapes vary a little between event types, so read defensively.
interface CreemObject {
  id?: string;
  status?: string;
  metadata?: Meta;
  customer?: { email?: string } | string;
  customer_email?: string;
  request_id?: string;
  product?: string | { id?: string };
  order?: { product?: string | { id?: string } };
  subscription?: { product?: string | { id?: string }; metadata?: Meta; status?: string };
  items?: { product?: string | { id?: string } }[];
}
interface CreemEvent {
  id?: string;
  eventType?: string;
  object?: CreemObject;
}

function idOf(p: string | { id?: string } | undefined): string | undefined {
  if (!p) return undefined;
  return typeof p === "string" ? p : p.id;
}

/** Pull the Creem product id from wherever the event happens to carry it. */
function productIdFrom(obj: CreemObject): string | undefined {
  return (
    idOf(obj.product) ||
    idOf(obj.order?.product) ||
    idOf(obj.subscription?.product) ||
    idOf(obj.items?.[0]?.product)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("creem-signature");

  if (!verifySignature(rawBody, signature)) {
    console.error("[creem] invalid webhook signature", {
      secretConfigured: Boolean(CREEM.webhookSecret),
      signaturePresent: Boolean(signature),
      signatureLength: signature?.length || 0,
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: CreemEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = event.eventType || "";
  const obj = event.object || {};
  const meta: Meta = obj.metadata || obj.subscription?.metadata || null;

  // Attribution: identity is the license key we set in metadata at checkout.
  // request_id is deliberately the same key and survives even if Creem omits
  // metadata from a future payload shape.
  const key = meta?.key || obj.request_id;
  const productId = meta?.product_id || productIdFrom(obj);
  const product = productId ? getProduct(productId) : undefined;
  // Licences are stored per group — one record per key, whatever was bought.
  const extension = meta?.extension || (product ? "cleanmysocial" : undefined);

  // Prefer the address the buyer gave us at checkout; fall back to whatever
  // Creem collected on its own page.
  const email =
    meta?.email ||
    (typeof obj.customer === "object" ? obj.customer?.email : undefined) ||
    obj.customer_email ||
    undefined;

  async function grant() {
    if (key && email && product) {
      await fulfillPaidProduct({
        key,
        creemId: obj.id,
        email,
        product,
      });
    } else {
      console.error("[creem] grant missing attribution", {
        eventId: event.id,
        eventType,
        objectId: obj.id,
        key,
        extension,
        emailPresent: Boolean(email),
        productId,
        metadataFields: meta ? Object.keys(meta) : [],
      });
      // A 2xx tells Creem fulfillment is complete. Throw so it retries instead
      // of silently dropping a paid customer as happened in the incident.
      throw new Error("grant missing attribution");
    }
  }
  async function revoke() {
    if (key && extension) await revokeLicense(extension, key);
    else console.warn("[creem] revoke missing attribution", { eventType, key, extension });
  }

  try {
    switch (eventType) {
      // One-time purchase completed, or a subscription's first payment. Grant
      // (or re-grant) access. Recurring renewals push expiry forward.
      case "checkout.completed":
      case "subscription.active":
      case "subscription.paid":
      case "subscription.trialing":
        await grant();
        break;

      // A subscription changed — grant while active/trialing, otherwise revoke.
      case "subscription.update": {
        const status = obj.status || obj.subscription?.status;
        if (status === "active" || status === "trialing") await grant();
        else await revoke();
        break;
      }

      // Access ends now (also lapses via the record's TTL). `scheduled_cancel`
      // and `past_due` are intentionally NOT here: the sub is still active
      // (scheduled to end at period end / in a payment-retry grace window), so
      // we let access run out naturally instead of cutting it early.
      case "subscription.canceled":
      case "subscription.expired":
      case "subscription.paused":
      case "refund.created":
      case "dispute.created":
        await revoke();
        break;

      default:
        // Acknowledge everything else so Creem doesn't retry.
        break;
    }
  } catch (e) {
    console.error("[creem] handler error", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Simple health check for the endpoint.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "creem-webhook" });
}
