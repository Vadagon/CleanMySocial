import { getExtension } from "./extensions";
import {
  activeEntitlementsOf,
  entitlementsOf,
  isActive,
  type EntitlementGrant,
  type License,
} from "./license";
import { getProduct } from "./products";
import { kvGetManyWithTtl, kvScan, storeConfigured } from "./store";

/**
 * Read-only view over everything in Redis, for the private admin browser at
 * /vault. Nothing here writes — it exists so support can answer "did this
 * person's license land?" without opening the Upstash console.
 *
 * The question support actually gets asked is narrower than that: "my key
 * doesn't work". A license record is stored per *group* (`cleanmysocial`) but
 * every extension checks its own slug, so "the record exists" and "this
 * customer's extension will unlock" are different questions. Every record is
 * therefore resolved through the same functions `/api/license` uses, and the
 * per-slug answer is what the table shows.
 */

export type RecordType =
  | "license"
  | "purchase"
  | "subscription"
  | "pending"
  | "reminded"
  | "undelivered"
  | "mailed"
  | "sweep"
  | "other";

/** What a single extension slug resolves to on one license key. */
export interface EntitlementRow {
  slug: string;
  /** human name, e.g. "Messenger Cleaner" */
  label: string;
  active: boolean;
  access: string | null;
  productId: string | null;
  productName: string | null;
  purchasedAt: number | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: number | null;
  revokedAt: number | null;
  revokeReason: string | null;
}

export type LicenseStatus =
  | "active"
  | "partly-revoked"
  | "revoked"
  | "expired"
  | "empty"
  | null;

export interface StoredRecord {
  key: string;
  type: RecordType;
  /** seconds; -1 = no expiry, -2 = key vanished between SCAN and GET */
  ttl: number;
  raw: string | null;
  /** parsed JSON when the value is JSON, otherwise null */
  value: Record<string, unknown> | null;
  /** flattened fields the table columns render, pulled from `value` */
  fields: {
    licenseKey: string | null;
    extension: string | null;
    email: string | null;
    plan: string | null;
    access: string | null;
    /** epoch ms — createdAt for pending records, updatedAt for licenses */
    at: number | null;
    expiresAt: number | null;
    remindedAt: number | null;
    /**
     * Licenses: does this key unlock *anything* right now, resolved exactly
     * the way `/api/license` resolves it. Never derived from `expiresAt`
     * alone — every record is written with `expiresAt: null`, so that field
     * says nothing about entitlements or revocations.
     */
    active: boolean | null;
    /** Licenses: finer-grained than `active`, for the status column. */
    status: LicenseStatus;
    /** Slugs this key unlocks right now. */
    activeSlugs: string[];
    /** Slugs this key has ever been granted, including revoked ones. */
    ownedSlugs: string[];
    /** Per-slug detail, newest purchase first. */
    entitlements: EntitlementRow[];
    /** Products bought on this key, resolved to names where we know them. */
    products: string[];
    /**
     * How the record is shaped. `legacy` records predate per-product
     * entitlements and are treated as full-bundle purchases.
     */
    schema: "grants" | "legacy" | null;
  };
}

function classify(key: string): RecordType {
  if (key.startsWith("license:")) return "license";
  if (key.startsWith("purchase:")) return "purchase";
  if (key.startsWith("subscription:")) return "subscription";
  if (key.startsWith("pending:")) return "pending";
  if (key.startsWith("reminded:")) return "reminded";
  if (key.startsWith("undelivered:")) return "undelivered";
  if (key.startsWith("mailed:") || key.startsWith("mailing:")) return "mailed";
  if (key.startsWith("sweep:")) return "sweep";
  return "other";
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];
}

/** Key shape is `<prefix>:<extension>:<license key>` for license/pending. */
function extensionFromKey(key: string): string | null {
  const parts = key.split(":");
  return parts.length >= 3 ? parts[1] : null;
}

function labelFor(slug: string): string {
  return getExtension(slug)?.shortName || slug;
}

function productLabel(productId: string): string {
  return getProduct(productId)?.name || productId;
}

/**
 * Resolve one license record into the per-slug answer each extension will get.
 * Deliberately routed through the same `lib/license` helpers as the public
 * endpoint so Vault can never disagree with what a customer's extension sees.
 */
function readLicense(value: Record<string, unknown>) {
  const license = value as unknown as License;
  const grants = (license.grants || null) as Record<string, EntitlementGrant> | null;
  const activeSlugs = activeEntitlementsOf(license);
  const ownedSlugs = entitlementsOf(license);
  const activeSet = new Set(activeSlugs);

  // One row per slug. A slug can hold several grants (bought singly, then
  // again inside a bundle); the row shows the one that actually decides
  // access, preferring a live grant over a revoked one.
  const rows: EntitlementRow[] = ownedSlugs.map((slug) => {
    const forSlug = grants
      ? Object.values(grants).filter((grant) => grant?.slug === slug)
      : [];
    const best =
      forSlug.find((grant) => !grant.revokedAt && grant.access === "lifetime") ||
      forSlug.find((grant) => !grant.revokedAt) ||
      forSlug.sort((a, b) => b.updatedAt - a.updatedAt)[0];

    return {
      slug,
      label: labelFor(slug),
      active: activeSet.has(slug),
      access: best?.access ?? license.access ?? null,
      productId: best?.productId ?? null,
      productName:
        best?.productName ??
        (best?.productId ? productLabel(best.productId) : null) ??
        (grants ? null : "Legacy CleanMySocial purchase"),
      purchasedAt: best?.purchasedAt ?? null,
      subscriptionStatus: best?.subscriptionStatus ?? null,
      currentPeriodEnd: best?.accessExpiresAt ?? best?.currentPeriodEnd ?? null,
      revokedAt: best?.revokedAt ?? null,
      revokeReason: best?.revokeReason ?? null,
    };
  });
  rows.sort((a, b) => Number(b.active) - Number(a.active) || a.label.localeCompare(b.label));

  const active = isActive(license);
  let status: LicenseStatus;
  if (!ownedSlugs.length) status = "empty";
  else if (active && activeSlugs.length < ownedSlugs.length) status = "partly-revoked";
  else if (active) status = "active";
  else if (rows.some((row) => row.revokedAt)) status = "revoked";
  else status = "expired";

  const products = strings(license.products as unknown).map(productLabel);

  return {
    active,
    status,
    activeSlugs: [...activeSlugs] as string[],
    ownedSlugs: [...ownedSlugs] as string[],
    entitlements: rows,
    products,
    schema: (grants ? "grants" : "legacy") as "grants" | "legacy",
  };
}

function toRecord(key: string, raw: string | null, ttl: number): StoredRecord {
  const type = classify(key);

  let value: Record<string, unknown> | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        value = parsed as Record<string, unknown>;
      }
    } catch {
      // plain string value (e.g. the sweep lock's timestamp) — leave it raw
    }
  }

  const v = value ?? {};
  const expiresAt = num(v.expiresAt);
  const resolved = type === "license" && value ? readLicense(value) : null;

  // Non-license records carry their slugs plainly; surface them in the same
  // column so a purchase row and its license row line up visually.
  const recordSlugs = resolved ? resolved.activeSlugs : strings(v.extensionSlugs);
  const recordProducts = resolved
    ? resolved.products
    : str(v.productId)
      ? [productLabel(str(v.productId)!)]
      : [];

  return {
    key,
    type,
    ttl,
    raw,
    value,
    fields: {
      licenseKey:
        str(v.key) ?? str(v.licenseKey) ?? str(key.split(":").slice(2).join(":")),
      extension:
        str(v.extension) ??
        (Array.isArray(v.extensionSlugs) ? v.extensionSlugs.join(", ") : null) ??
        extensionFromKey(key),
      email: str(v.email),
      plan: str(v.plan) ?? str(v.productName),
      access: str(v.access) ?? str(v.accessGranted),
      at: num(v.updatedAt) ?? num(v.createdAt),
      expiresAt,
      remindedAt: num(v.remindedAt),
      active: resolved ? resolved.active : null,
      status: resolved ? resolved.status : null,
      activeSlugs: recordSlugs,
      ownedSlugs: resolved ? resolved.ownedSlugs : recordSlugs,
      entitlements: resolved ? resolved.entitlements : [],
      products: recordProducts,
      schema: resolved ? resolved.schema : null,
    },
  };
}

export interface RecordsSnapshot {
  storeConfigured: boolean;
  fetchedAt: number;
  total: number;
  counts: Record<RecordType, number>;
  records: StoredRecord[];
}

/**
 * Every key in the store, newest first. `pattern` narrows the SCAN itself,
 * which matters once the keyspace is large — the UI's search box only filters
 * what has already been fetched.
 */
export async function listAllRecords(pattern = "*"): Promise<RecordsSnapshot> {
  // Crash telemetry has its own aggregated browser. Keeping thousands of
  // short-lived events out of Vault preserves the license/support view.
  const scanned = await kvScan(pattern);
  const keys = pattern === "*" ? scanned.filter((key) => !key.startsWith("crash:")) : scanned;
  const rows = await kvGetManyWithTtl(keys);
  const records = rows.map(({ key, value, ttl }) => toRecord(key, value, ttl));

  // Records with a timestamp sort newest first; the rest (locks, claims) sink
  // to the bottom where they belong.
  records.sort((a, b) => (b.fields.at ?? 0) - (a.fields.at ?? 0));

  const counts: Record<RecordType, number> = {
    license: 0,
    purchase: 0,
    subscription: 0,
    pending: 0,
    reminded: 0,
    undelivered: 0,
    mailed: 0,
    sweep: 0,
    other: 0,
  };
  for (const r of records) counts[r.type]++;

  return {
    storeConfigured,
    fetchedAt: Date.now(),
    total: records.length,
    counts,
    records,
  };
}

/**
 * Answer "will this key unlock this extension?" for one key, without scanning
 * the keyspace. Support's first question, and the one Vault's table used to
 * get wrong.
 */
export async function lookupLicenseKey(key: string): Promise<StoredRecord | null> {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return null;
  const storeKey = `license:cleanmysocial:${normalized}`;
  const [row] = await kvGetManyWithTtl([storeKey]);
  if (!row?.value) return null;
  return toRecord(storeKey, row.value, row.ttl);
}
