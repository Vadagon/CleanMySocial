import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CREEM } from "@/lib/site";
import { findByProductId, groupOf } from "@/lib/extensions";
import { grantLicense, revokeLicense } from "@/lib/license";
import type { Access } from "@/lib/extensions";

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

type Meta = { key?: string; extension?: string; plan?: string } | null | undefined;

// Creem nests the resource (checkout / subscription / order) under `object`.
// Shapes vary a little between event types, so read defensively.
interface CreemObject {
  id?: string;
  status?: string;
  metadata?: Meta;
  request_id?: string;
  product?: string | { id?: string };
  order?: { product?: string | { id?: string } };
  subscription?: { product?: string | { id?: string }; metadata?: Meta; status?: string };
  items?: { product?: string | { id?: string } }[];
}
interface CreemEvent {
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
  const key = meta?.key;
  const productId = productIdFrom(obj);
  const mapped = productId ? findByProductId(productId) : undefined;
  // `extension` is the license *group* (metadata already carries the group; the
  // product fallback collapses to the group too).
  const extension = meta?.extension || (mapped ? groupOf(mapped.extension) : undefined);
  const plan = meta?.plan || mapped?.plan.plan;
  const access: Access | undefined = mapped?.plan.access;

  async function grant() {
    if (key && extension && plan && access) {
      await grantLicense({ key, extension, plan, access, creemId: obj.id });
    } else {
      console.warn("[creem] grant missing attribution", {
        eventType,
        key,
        extension,
        plan,
        access,
        productId,
      });
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
