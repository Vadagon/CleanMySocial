import { kvGet, kvSet } from "./store";
import type { Access } from "./extensions";
import { ALL_PREMIUM_SLUGS, BUNDLE_ENTITLEMENTS, mergeEntitlements } from "./products";
import type { BillingPeriod, BillingType, PremiumSlug } from "./products";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "scheduled_cancel"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "expired"
  | "paused"
  | "unknown";

export interface EntitlementGrant {
  slug: PremiumSlug;
  access: Access;
  productId: string;
  productName?: string;
  billingType: BillingType;
  billingPeriod: BillingPeriod;
  purchasedAt: number;
  updatedAt: number;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: number;
  /** Fixed expiry for a short one-time pass. */
  accessExpiresAt?: number;
  lastPaidAt?: number;
  revokedAt?: number;
  revokeReason?: "refund" | "dispute" | "manual";
}

export interface License {
  /** license key = the extension's install token (also shown on the success page) */
  key: string;
  extension: string;
  plan: string;
  access: Access;
  /** Legacy summary boundary; fixed for passes, null for open-ended compatibility. */
  expiresAt: number | null;
  updatedAt: number;
  creemId?: string;
  /** where the key was mailed, kept so support can re-send it */
  email?: string;
  /**
   * Which premium extensions this key unlocks. Absent on records written
   * before per-product pricing — those were all bundle purchases, so a missing
   * field means "everything" (see entitlementsOf).
   */
  entitlements?: PremiumSlug[];
  /** Creem product ids this key has paid for, newest last. */
  products?: string[];
  /** Exact access source for each extension on this shared license key. */
  grants?: Record<string, EntitlementGrant>;
}

/**
 * Subscriptions are enforced: a cancelled or expired subscription stops
 * unlocking its extension. Lifetime purchases are never affected.
 *
 * Set ENFORCE_SUBSCRIPTIONS=false to fall back to record-only mode, which is
 * how this ran before monthly plans existed.
 */
export const subscriptionsEnforced = process.env.ENFORCE_SUBSCRIPTIONS !== "false";

/** Entitlements of a license, treating pre-entitlement records as full bundles. */
export function entitlementsOf(license: License | null): PremiumSlug[] {
  if (!license) return [];
  if (license.grants) {
    const owned = new Set(Object.values(license.grants).map((grant) => grant.slug));
    return ALL_PREMIUM_SLUGS.filter((slug) => owned.has(slug));
  }
  if (!license.entitlements) return [...BUNDLE_ENTITLEMENTS];
  return license.entitlements;
}

export function activeEntitlementsOf(license: License | null): PremiumSlug[] {
  if (!license) return [];
  if (license.grants) {
    return ALL_PREMIUM_SLUGS.filter((slug) =>
      Object.values(license.grants || {}).some(
        (grant) => grant.slug === slug && isGrantActive(grant),
      ),
    );
  }
  return isLegacyActive(license) ? entitlementsOf(license) : [];
}

/** Does this license unlock a specific extension? */
export function entitles(license: License | null, slug: string): boolean {
  if (!license) return false;
  const premiumSlug = slug as PremiumSlug;
  if (license.grants) {
    return Object.values(license.grants).some(
      (grant) => grant.slug === premiumSlug && isGrantActive(grant),
    );
  }
  return isLegacyActive(license) && entitlementsOf(license).includes(premiumSlug);
}

/** Best current grant for the requested extension, for the license API UI. */
export function activeGrantFor(
  license: License | null,
  slug: string,
): EntitlementGrant | null {
  if (!license?.grants) return null;
  const matching = Object.values(license.grants).filter(
    (grant) => grant.slug === slug && isGrantActive(grant),
  );
  return (
    matching.find((grant) => grant.access === "lifetime") ||
    matching.find((grant) => grant.access === "subscription") ||
    matching.sort((a, b) => b.updatedAt - a.updatedAt)[0] ||
    null
  );
}

/**
 * Best grant to describe in the license API, even after it becomes inactive.
 * Active access wins; otherwise return the most recently updated matching
 * grant so clients still receive its status and paid-through date.
 */
export function grantFor(
  license: License | null,
  slug: string,
): EntitlementGrant | null {
  const active = activeGrantFor(license, slug);
  if (active) return active;
  if (!license?.grants) return null;
  return (
    Object.values(license.grants)
      .filter((grant) => grant.slug === slug)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
  );
}

/** Normalize a key so lookups match regardless of casing/whitespace. */
export function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function storeKey(extension: string, key: string) {
  return `license:${extension}:${normalizeKey(key)}`;
}

function isGrantActive(grant: EntitlementGrant): boolean {
  if (grant.revokedAt) return false;
  if (grant.access === "lifetime") return true;
  if (grant.access === "pass") {
    return Boolean(grant.accessExpiresAt && grant.accessExpiresAt > Date.now());
  }
  if (!subscriptionsEnforced) return true;

  const status = grant.subscriptionStatus || "unknown";
  // A grant we never tracked a subscription for predates subscription
  // recording. Turning enforcement on must not silently revoke those.
  if (status === "unknown" && !grant.subscriptionId) return true;
  if (status === "active" || status === "trialing") return true;
  const paidThrough = grant.currentPeriodEnd || 0;
  if (status === "scheduled_cancel") return paidThrough > Date.now();
  if (status === "past_due") return paidThrough + 7 * 24 * 60 * 60 * 1000 > Date.now();
  return false;
}

function isLegacyActive(license: License): boolean {
  if (license.expiresAt === null) return true;
  return license.expiresAt > Date.now();
}

export async function grantLicense(input: {
  key: string;
  extension: string;
  plan: string;
  access: Access;
  creemId?: string;
  email?: string;
  /** what this purchase unlocks; omitted means the full bundle */
  entitlements?: PremiumSlug[];
  productId?: string;
  productName?: string;
  billingType?: BillingType;
  billingPeriod?: BillingPeriod;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: number;
  accessDurationDays?: number;
  paidAt?: number;
}): Promise<License> {
  // Buying a second product adds to what the key already owns rather than
  // replacing it — someone who bought Messenger Cleaner and later the combo
  // must keep both.
  const existing = await getLicense(input.extension, input.key);
  const granted = input.entitlements ?? [...BUNDLE_ENTITLEMENTS];
  const entitlements = existing
    ? mergeEntitlements(entitlementsOf(existing), granted)
    : granted;
  const products = [
    ...(existing?.products || []),
    ...(input.productId && !existing?.products?.includes(input.productId)
      ? [input.productId]
      : []),
  ];

  const now = Date.now();
  const grants = { ...(existing?.grants || {}) };
  if (existing && !existing.grants) {
    for (const slug of entitlementsOf(existing)) {
      grants[`legacy:${slug}`] = {
        slug,
        access: existing.access,
        productId: existing.products?.[0] || "legacy",
        productName: "Legacy CleanMySocial purchase",
        billingType: existing.access === "subscription" ? "recurring" : "onetime",
        billingPeriod: existing.access === "subscription" ? "every-month" : "once",
        purchasedAt: existing.updatedAt,
        updatedAt: existing.updatedAt,
      };
    }
  }
  for (const slug of granted) {
    const grantKey = `${input.productId || "legacy"}:${slug}`;
    const before = grants[grantKey];
    const purchasedAt = before && !before.revokedAt
      ? before.purchasedAt
      : input.paidAt || now;
    const accessExpiresAt = input.access === "pass"
      ? before && !before.revokedAt && before.accessExpiresAt
        ? before.accessExpiresAt
        : purchasedAt + (input.accessDurationDays || 3) * 24 * 60 * 60 * 1000
      : undefined;
    grants[grantKey] = {
      slug,
      access: input.access,
      productId: input.productId || before?.productId || "legacy",
      productName: input.productName || before?.productName,
      billingType:
        input.billingType || (input.access === "subscription" ? "recurring" : "onetime"),
      billingPeriod:
        input.billingPeriod || (input.access === "subscription" ? "every-month" : "once"),
      purchasedAt,
      updatedAt: now,
      subscriptionId: input.subscriptionId || before?.subscriptionId,
      subscriptionStatus:
        input.subscriptionStatus ||
        before?.subscriptionStatus ||
        (input.access === "subscription" ? "active" : undefined),
      currentPeriodEnd: input.currentPeriodEnd || before?.currentPeriodEnd,
      accessExpiresAt,
      lastPaidAt: input.paidAt || before?.lastPaidAt,
    };
  }

  const hasLifetime = Object.values(grants).some(
    (grant) => grant?.access === "lifetime" && !grant.revokedAt,
  );
  const hasSubscription = Object.values(grants).some(
    (grant) => grant?.access === "subscription" && isGrantActive(grant),
  );
  const passExpiry = Math.max(
    0,
    ...Object.values(grants)
      .filter((grant) => grant?.access === "pass" && isGrantActive(grant))
      .map((grant) => grant.accessExpiresAt || 0),
  );

  const license: License = {
    key: normalizeKey(input.key),
    extension: input.extension,
    plan: input.plan,
    access: hasLifetime ? "lifetime" : input.access,
    // Entitlement grants are authoritative. Monthly/lifetime retain the legacy
    // open summary for older extension versions; a short pass must expose its
    // real boundary so it can never be mistaken for permanent access.
    expiresAt: hasLifetime || hasSubscription ? null : passExpiry || null,
    updatedAt: now,
    creemId: input.creemId,
    email: input.email ?? existing?.email,
    entitlements,
    products,
    grants,
  };
  await kvSet(storeKey(input.extension, input.key), JSON.stringify(license));
  return license;
}

export async function revokeLicense(
  extension: string,
  key: string,
  options: {
    productId?: string;
    entitlements?: PremiumSlug[];
    reason?: "refund" | "dispute" | "manual";
  } = {},
): Promise<void> {
  const existing = await getLicense(extension, key);
  if (!existing) return;
  const now = Date.now();
  if (existing.grants) {
    const requested = new Set(options.entitlements || []);
    const grants = { ...existing.grants };
    for (const [grantKey, grant] of Object.entries(grants)) {
      const matches = options.productId
        ? grant.productId === options.productId
        : requested.size
          ? requested.has(grant.slug)
          : true;
      if (matches) {
        grants[grantKey] = {
          ...grant,
          revokedAt: now,
          revokeReason: options.reason || "manual",
          updatedAt: now,
        };
      }
    }
    await kvSet(
      storeKey(extension, key),
      JSON.stringify({ ...existing, grants, updatedAt: now }),
    );
    return;
  }
  const revoked: License = { ...existing, expiresAt: now, updatedAt: now };
  await kvSet(storeKey(extension, key), JSON.stringify(revoked), 7 * 24 * 60 * 60);
}

export async function updateSubscriptionGrant(input: {
  extension: string;
  key: string;
  productId?: string;
  subscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: number;
  paidAt?: number;
}): Promise<void> {
  const existing = await getLicense(input.extension, input.key);
  if (!existing?.grants) return;
  const now = Date.now();
  const grants = { ...existing.grants };
  for (const [grantKey, grant] of Object.entries(grants)) {
    if (!grant || grant.access !== "subscription") continue;
    if (input.productId && grant.productId !== input.productId) continue;
    if (input.subscriptionId && grant.subscriptionId && grant.subscriptionId !== input.subscriptionId) {
      continue;
    }
    grants[grantKey] = {
      ...grant,
      subscriptionId: input.subscriptionId || grant.subscriptionId,
      subscriptionStatus: input.status,
      currentPeriodEnd: input.currentPeriodEnd || grant.currentPeriodEnd,
      lastPaidAt: input.paidAt || grant.lastPaidAt,
      updatedAt: now,
    };
  }
  await kvSet(
    storeKey(input.extension, input.key),
    JSON.stringify({ ...existing, grants, updatedAt: now }),
  );
}

export async function getLicense(
  extension: string,
  key: string
): Promise<License | null> {
  const raw = await kvGet(storeKey(extension, key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as License;
  } catch {
    return null;
  }
}

export function isActive(license: License | null): boolean {
  if (!license) return false;
  if (license.grants) return Object.values(license.grants).some((grant) => grant && isGrantActive(grant));
  return isLegacyActive(license);
}
