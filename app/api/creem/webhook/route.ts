import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CREEM } from "@/lib/site";
import { getProduct } from "@/lib/products";
import {
  revokeLicense,
  updateSubscriptionGrant,
  type SubscriptionStatus,
} from "@/lib/license";
import { fulfillPaidProduct } from "@/lib/fulfillment";
import { kvGet } from "@/lib/store";

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
      product_locale?: string;
    }
  | null
  | undefined;

// Creem nests the resource (checkout / subscription / order) under `object`.
// Shapes vary a little between event types, so read defensively.
interface CreemObject {
  id?: string;
  object?: string;
  status?: string;
  metadata?: Meta;
  customer?: { email?: string } | string;
  customer_email?: string;
  request_id?: string;
  product?: string | { id?: string };
  order?: { product?: string | { id?: string } };
  subscription?:
    | string
    | {
        id?: string;
        product?: string | { id?: string };
        metadata?: Meta;
        status?: string;
        current_period_end_date?: string | number;
      };
  items?: { product?: string | { id?: string } }[];
  current_period_end_date?: string | number;
  current_period_start_date?: string | number;
}
interface CreemEvent {
  id?: string;
  eventType?: string;
  object?: CreemObject;
}

interface SubscriptionAttribution {
  licenseGroup?: string;
  licenseKey?: string;
  productId?: string;
  email?: string;
  productLocale?: string;
}

function idOf(p: string | { id?: string } | undefined): string | undefined {
  if (!p) return undefined;
  return typeof p === "string" ? p : p.id;
}

/** Pull the Creem product id from wherever the event happens to carry it. */
function productIdFrom(obj: CreemObject): string | undefined {
  const subscription = typeof obj.subscription === "object" ? obj.subscription : undefined;
  return (
    idOf(obj.product) ||
    idOf(obj.order?.product) ||
    idOf(subscription?.product) ||
    idOf(obj.items?.[0]?.product)
  );
}

function subscriptionIdFrom(obj: CreemObject): string | undefined {
  if (obj.object === "subscription") return obj.id;
  if (typeof obj.subscription === "string") return obj.subscription;
  return obj.subscription?.id;
}

function epoch(value: string | number | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value !== "string") return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric < 1e12 ? numeric * 1000 : numeric;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const nestedSubscription =
    typeof obj.subscription === "object" ? obj.subscription : undefined;
  const meta: Meta = obj.metadata || nestedSubscription?.metadata || null;
  const subscriptionId = subscriptionIdFrom(obj);
  let attribution: SubscriptionAttribution | null = null;
  if (subscriptionId) {
    const raw = await kvGet(`subscription:creem:${subscriptionId}`);
    if (raw) {
      try {
        attribution = JSON.parse(raw) as SubscriptionAttribution;
      } catch {
        console.error("[creem] invalid subscription attribution", { subscriptionId });
      }
    }
  }

  // Attribution: identity is the license key we set in metadata at checkout.
  // request_id is deliberately the same key and survives even if Creem omits
  // metadata from a future payload shape.
  const key = meta?.key || obj.request_id || attribution?.licenseKey;
  const productId = meta?.product_id || productIdFrom(obj) || attribution?.productId;
  const product = productId ? getProduct(productId) : undefined;
  // Licences are stored per group — one record per key, whatever was bought.
  const extension =
    meta?.extension || attribution?.licenseGroup || (product ? "cleanmysocial" : undefined);

  // Prefer the address the buyer gave us at checkout; fall back to whatever
  // Creem collected on its own page.
  const email =
    meta?.email ||
    (typeof obj.customer === "object" ? obj.customer?.email : undefined) ||
    obj.customer_email ||
    attribution?.email ||
    undefined;
  const currentPeriodEnd = epoch(
    obj.current_period_end_date || nestedSubscription?.current_period_end_date,
  );

  async function grant(status?: "active" | "trialing", paidAt?: number) {
    if (key && email && product) {
      await fulfillPaidProduct({
        key,
        creemId: obj.id,
        email,
        product,
        subscriptionId,
        subscriptionStatus: status,
        currentPeriodEnd,
        paidAt,
        locale: meta?.product_locale || attribution?.productLocale,
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
  async function revoke(reason: "refund" | "dispute") {
    if (key && extension) {
      await revokeLicense(extension, key, {
        productId,
        entitlements: product?.entitlements,
        reason,
      });
    }
    else console.warn("[creem] revoke missing attribution", { eventType, key, extension });
  }

  async function recordSubscription(status: SubscriptionStatus, paidAt?: number) {
    if (!key || !extension) {
      console.warn("[creem] subscription update missing attribution", {
        eventType,
        key,
        extension,
        subscriptionId,
      });
      return;
    }
    await updateSubscriptionGrant({
      extension,
      key,
      productId,
      subscriptionId,
      status,
      currentPeriodEnd,
      paidAt,
    });
  }

  try {
    switch (eventType) {
      // One-time purchase completed, or a subscription's first payment. Grant
      // (or re-grant) access. Recurring renewals push expiry forward.
      case "checkout.completed":
        await grant(product?.access === "subscription" ? "active" : undefined, Date.now());
        break;
      case "subscription.active":
        await grant("active", Date.now());
        await recordSubscription("active", Date.now());
        break;
      case "subscription.paid":
        await grant("active", Date.now());
        await recordSubscription("active", Date.now());
        break;
      case "subscription.trialing":
        await grant("trialing");
        await recordSubscription("trialing");
        break;

      // Record every state now. Enforcement can be enabled later without a
      // Redis migration because paid-through and cancellation data is ready.
      case "subscription.update": {
        const rawStatus = obj.status || nestedSubscription?.status || "unknown";
        const status = rawStatus as SubscriptionStatus;
        if (status === "active" || status === "trialing") await grant(status);
        await recordSubscription(status);
        break;
      }
      case "subscription.scheduled_cancel":
        await recordSubscription("scheduled_cancel");
        break;
      case "subscription.past_due":
        await recordSubscription("past_due");
        break;
      case "subscription.unpaid":
        await recordSubscription("unpaid");
        break;
      case "subscription.canceled":
        await recordSubscription("canceled");
        break;
      case "subscription.expired":
        await recordSubscription("expired");
        break;
      case "subscription.paused":
        await recordSubscription("paused");
        break;
      case "refund.created":
        await revoke("refund");
        break;
      case "dispute.created":
        await revoke("dispute");
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
