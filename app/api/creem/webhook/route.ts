import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CREEM } from "@/lib/site";
import { BUNDLE_ENTITLEMENTS, getProduct } from "@/lib/products";
import type { PremiumSlug } from "@/lib/products";
import { grantLicense, revokeLicense } from "@/lib/license";
import { sendLicenseEmail } from "@/lib/mail";
import { clearPendingCheckout } from "@/lib/pending";
import { kvDel, kvGet, kvSet, kvSetNx } from "@/lib/store";
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

/** Accept only entitlement slugs this deployment actually knows how to serve. */
function entitlementsFrom(meta: Meta): PremiumSlug[] | undefined {
  if (!meta?.entitlements) return undefined;
  const requested = meta.entitlements.split(",").filter(Boolean);
  const allowed = new Set<PremiumSlug>(BUNDLE_ENTITLEMENTS);
  if (!requested.length || requested.some((slug) => !allowed.has(slug as PremiumSlug))) {
    return undefined;
  }
  return requested as PremiumSlug[];
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
  // request_id is deliberately the same key and survives even if Creem omits
  // metadata from a future payload shape.
  const key = meta?.key || obj.request_id;
  const productId = meta?.product_id || productIdFrom(obj);
  const product = productId ? getProduct(productId) : undefined;
  const metadataEntitlements = entitlementsFrom(meta);
  // Licences are stored per group — one record per key, whatever was bought.
  const extension = meta?.extension || (product ? "cleanmysocial" : undefined);
  const plan = meta?.plan || product?.kind || (metadataEntitlements ? "lifetime" : undefined);
  // Every product currently sold is a one-time lifetime purchase. Metadata is
  // a signed copy produced by our checkout route, so it is a safe fallback if
  // a product is renamed or removed before Creem delivers the webhook.
  const access: Access | undefined =
    product || metadataEntitlements ? "lifetime" : undefined;
  // Prefer the product's own definition; fall back to the metadata copy in case
  // a product is renamed or removed between checkout and payment.
  const entitlements: PremiumSlug[] | undefined =
    product?.entitlements || metadataEntitlements;

  // Prefer the address the buyer gave us at checkout; fall back to whatever
  // Creem collected on its own page.
  const email =
    meta?.email ||
    (typeof obj.customer === "object" ? obj.customer?.email : undefined) ||
    obj.customer_email ||
    undefined;

  /**
   * Mail the key once per license. Creem retries webhooks and fires several
   * grant-worthy events, so a marker keeps the buyer from getting duplicates.
   * Mail failure must fail the webhook so Creem retries incomplete fulfillment.
   */
  async function mailKey(licenseKey: string, group: string) {
    if (!email) throw new Error("license email address missing");
    const marker = `mailed:${group}:${licenseKey.toLowerCase()}`;
    const claim = `mailing:${group}:${licenseKey.toLowerCase()}`;
    if (await kvGet(marker)) return;

    // Multiple Creem event types can arrive together. Let just one of them
    // send while the others return a retryable error instead of duplicating
    // the message. A short TTL makes a crashed sender recover automatically.
    if (!(await kvSetNx(claim, String(Date.now()), 5 * 60))) {
      throw new Error("license email is already being sent");
    }
    try {
      const sent = await sendLicenseEmail(email, licenseKey);
      if (!sent) throw new Error("license email was not accepted by SMTP");
      await kvSet(marker, String(Date.now()));
    } finally {
      await kvDel(claim);
    }
  }

  async function grant() {
    if (key && extension && plan && access) {
      await grantLicense({
        key,
        extension,
        plan,
        access,
        creemId: obj.id,
        email,
        entitlements,
        productId: product?.id,
      });
      // Paid — so it is no longer an abandoned checkout.
      await clearPendingCheckout(extension, key);
      await mailKey(key, extension);
    } else {
      console.error("[creem] grant missing attribution", {
        eventId: event.id,
        eventType,
        objectId: obj.id,
        key,
        extension,
        plan,
        access,
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
