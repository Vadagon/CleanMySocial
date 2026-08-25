import { grantLicense } from "./license";
import { sendLicenseEmail } from "./mail";
import { getProduct, PRICING_VARIANT, type Product } from "./products";
import { clearPendingCheckout } from "./pending";
import { kvDel, kvGet, kvScan, kvSet, kvSetNx } from "./store";

const LICENSE_GROUP = "cleanmysocial";

/**
 * A paid order whose license key never reached the customer.
 *
 * Creem retries a failing webhook only a handful of times, so a transient SMTP
 * problem used to be able to leave a granted license with nobody knowing its
 * key. These records outlive the webhook: the hourly sweep retries them, and
 * Vault lists them so a stuck one is visible rather than silent.
 */
export interface UndeliveredLicense {
  licenseGroup: string;
  licenseKey: string;
  email: string;
  productId: string;
  productName: string;
  attempts: number;
  firstFailedAt: number;
  lastAttemptAt: number;
  lastError: string;
}

function mailedMarker(key: string, productId: string) {
  return `mailed:${LICENSE_GROUP}:${key}:${productId}`;
}

function undeliveredKey(key: string, productId: string) {
  return `undelivered:${LICENSE_GROUP}:${key}:${productId}`;
}

async function recordUndelivered(input: {
  key: string;
  email: string;
  product: Product;
  error: string;
}): Promise<void> {
  const storeKey = undeliveredKey(input.key, input.product.id);
  let existing: UndeliveredLicense | null = null;
  const raw = await kvGet(storeKey);
  if (raw) {
    try {
      existing = JSON.parse(raw) as UndeliveredLicense;
    } catch {
      existing = null;
    }
  }
  const now = Date.now();
  const record: UndeliveredLicense = {
    licenseGroup: LICENSE_GROUP,
    licenseKey: input.key,
    email: input.email,
    productId: input.product.id,
    productName: input.product.name,
    attempts: (existing?.attempts || 0) + 1,
    firstFailedAt: existing?.firstFailedAt || now,
    lastAttemptAt: now,
    lastError: input.error,
  };
  // Deliberately no TTL: an undelivered key must never quietly disappear.
  await kvSet(storeKey, JSON.stringify(record));
}

/**
 * Retry backoff, capped at a day. Never gives up — the record is only removed
 * once the key is actually in the customer's inbox (or support resolves it).
 */
function readyToRetry(record: UndeliveredLicense, now: number): boolean {
  const hour = 60 * 60 * 1000;
  const wait = Math.min(record.attempts * record.attempts * hour, 24 * hour);
  return now - record.lastAttemptAt >= wait;
}

export async function listUndeliveredLicenses(): Promise<UndeliveredLicense[]> {
  const keys = await kvScan(`undelivered:${LICENSE_GROUP}:*`);
  const records: UndeliveredLicense[] = [];
  for (const key of keys) {
    const raw = await kvGet(key);
    if (!raw) continue;
    try {
      records.push(JSON.parse(raw) as UndeliveredLicense);
    } catch {
      console.error("[fulfillment] unreadable undelivered record", key);
    }
  }
  return records;
}

export interface RedeliveryResult {
  considered: number;
  retried: number;
  delivered: number;
}

/**
 * Re-send every license key that has not reached its customer yet. Safe to
 * call repeatedly and from anywhere — the `mailed:` marker and the per-record
 * claim make a duplicate email impossible.
 */
export async function retryUndeliveredLicenses(limit = 5): Promise<RedeliveryResult> {
  const result: RedeliveryResult = { considered: 0, retried: 0, delivered: 0 };
  const now = Date.now();

  for (const record of await listUndeliveredLicenses()) {
    result.considered++;
    if (result.retried >= limit) continue;

    const storeKey = undeliveredKey(record.licenseKey, record.productId);
    // Already delivered by another path (webhook retry, checkout return).
    if (await kvGet(mailedMarker(record.licenseKey, record.productId))) {
      await kvDel(storeKey);
      continue;
    }
    if (!readyToRetry(record, now)) continue;

    const product = getProduct(record.productId);
    if (!product) {
      console.error("[fulfillment] undelivered record names an unknown product", {
        productId: record.productId,
      });
      continue;
    }

    result.retried++;
    const sent = await sendLicenseEmail(record.email, record.licenseKey, product);
    if (sent) {
      await kvSet(mailedMarker(record.licenseKey, record.productId), String(Date.now()));
      await kvDel(storeKey);
      result.delivered++;
    } else {
      await recordUndelivered({
        key: record.licenseKey,
        email: record.email,
        product,
        error: "retry: license email was not accepted by SMTP",
      });
    }
  }

  return result;
}

/**
 * Grant a paid product and deliver its key exactly once. This is shared by the
 * webhook and the verified checkout-return fallback so either path can finish
 * an order without creating duplicate mail.
 */
export async function fulfillPaidProduct(input: {
  key: string;
  email: string;
  product: Product;
  creemId?: string;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "trialing";
  currentPeriodEnd?: number;
  paidAt?: number;
}): Promise<void> {
  const { key, email, product, creemId } = input;
  const plan = product.access === "pass"
    ? "hot"
    : product.access === "subscription"
      ? "monthly"
      : "lifetime";

  await grantLicense({
    key,
    extension: LICENSE_GROUP,
    plan,
    access: product.access,
    creemId,
    email,
    entitlements: product.entitlements,
    productId: product.id,
    productName: product.name,
    billingType: product.billingType,
    billingPeriod: product.billingPeriod,
    subscriptionId: input.subscriptionId,
    subscriptionStatus: input.subscriptionStatus,
    currentPeriodEnd: input.currentPeriodEnd,
    accessDurationDays: product.durationDays,
    paidAt: input.paidAt,
  });
  const auditId = creemId || `${product.id}:${Date.now()}`;
  await kvSet(
    `purchase:creem:${auditId}`,
    JSON.stringify({
      licenseGroup: LICENSE_GROUP,
      licenseKey: key.trim().toLowerCase(),
      extensionSlugs: product.entitlements,
      productId: product.id,
      productName: product.name,
      billingType: product.billingType,
      billingPeriod: product.billingPeriod,
      accessGranted: product.access,
      pricingVariant: PRICING_VARIANT,
      subscriptionId: input.subscriptionId || null,
      subscriptionStatus: input.subscriptionStatus || null,
      currentPeriodEnd: input.currentPeriodEnd || null,
      accessDurationDays: product.durationDays || null,
      email,
      updatedAt: Date.now(),
    }),
  );
  if (input.subscriptionId) {
    // Subscription lifecycle payloads do not always repeat checkout metadata.
    // This durable reverse lookup keeps renewals/cancellations attributable to
    // the exact license and product that created the Creem subscription.
    await kvSet(
      `subscription:creem:${input.subscriptionId}`,
      JSON.stringify({
        subscriptionId: input.subscriptionId,
        licenseGroup: LICENSE_GROUP,
        licenseKey: key.trim().toLowerCase(),
        productId: product.id,
        productName: product.name,
        extensionSlugs: product.entitlements,
        email,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  }
  await clearPendingCheckout(LICENSE_GROUP, key);

  const normalizedKey = key.trim().toLowerCase();
  const marker = mailedMarker(normalizedKey, product.id);
  const claim = `mailing:${LICENSE_GROUP}:${normalizedKey}:${product.id}`;
  if (await kvGet(marker)) return;

  // Webhook and return-page confirmation can race. One sends; the other gets
  // a retryable failure. The short lock recovers automatically after a crash.
  if (!(await kvSetNx(claim, String(Date.now()), 5 * 60))) {
    throw new Error("license email is already being sent");
  }
  try {
    const sent = await sendLicenseEmail(email, key, product);
    if (!sent) {
      // Creem's own retries are finite, so queue the key for redelivery before
      // handing back the error that triggers them.
      await recordUndelivered({
        key: normalizedKey,
        email,
        product,
        error: "license email was not accepted by SMTP",
      });
      throw new Error("license email was not accepted by SMTP");
    }
    await kvSet(marker, String(Date.now()));
    await kvDel(undeliveredKey(normalizedKey, product.id));
  } finally {
    await kvDel(claim);
  }
}
