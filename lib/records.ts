import { kvGetManyWithTtl, kvScan, storeConfigured } from "./store";

/**
 * Read-only view over everything in Redis, for the private admin browser at
 * /vault. Nothing here writes — it exists so support can answer "did this
 * person's license land?" without opening the Upstash console.
 */

export type RecordType =
  | "license"
  | "purchase"
  | "subscription"
  | "pending"
  | "reminded"
  | "sweep"
  | "other";

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
    /** true for a license with no expiry or one still in the future */
    active: boolean | null;
  };
}

function classify(key: string): RecordType {
  if (key.startsWith("license:")) return "license";
  if (key.startsWith("purchase:")) return "purchase";
  if (key.startsWith("subscription:")) return "subscription";
  if (key.startsWith("pending:")) return "pending";
  if (key.startsWith("reminded:")) return "reminded";
  if (key.startsWith("sweep:")) return "sweep";
  return "other";
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Key shape is `<prefix>:<extension>:<license key>` for license/pending. */
function extensionFromKey(key: string): string | null {
  const parts = key.split(":");
  return parts.length >= 3 ? parts[1] : null;
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
  const active =
    type === "license" ? expiresAt === null || expiresAt > Date.now() : null;

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
      active,
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
