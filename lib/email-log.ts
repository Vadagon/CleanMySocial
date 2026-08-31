import { randomUUID } from "node:crypto";
import { EXTENSIONS } from "./extensions";
import type { DashboardFilters } from "./dashboard-filters";
import { filterDashboardKeys, matchesDashboardFilters } from "./dashboard-filters";
import { kvGetManyWithTtl, kvScan, kvSet, storeConfigured } from "./store";

const PREFIX = "email-log:";
const retentionDays = Math.min(365, Math.max(1, Number(process.env.EMAIL_LOG_RETENTION_DAYS) || 90));
const retentionSeconds = retentionDays * 86_400;
const MAX_RESULTS = 1_000;

export type EmailLogKind =
  | "license"
  | "abandoned_checkout"
  | "breakage_report"
  | "crash_alert"
  | "trustpilot_invite";

export type EmailLogStatus = "sent" | "rejected" | "failed" | "skipped";

export interface EmailLogEntry {
  id: string;
  at: number;
  kind: EmailLogKind;
  status: EmailLogStatus;
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  accepted: string[];
  rejected: string[];
  messageId?: string;
  error?: string;
  extension?: string;
  productId?: string;
  version?: string;
  code?: string;
  fingerprint?: string;
}

export type EmailLogInput = Omit<EmailLogEntry, "id" | "at"> & { at?: number };

export interface EmailLogSnapshot {
  fetchedAt: number;
  storeConfigured: boolean;
  retentionDays: number;
  total: number;
  sent: number;
  rejected: number;
  failed: number;
  skipped: number;
  deliveryRate: number;
  truncated: boolean;
  byExtension: Array<{ extension: string; name: string; emails: number }>;
  entries: EmailLogEntry[];
}

function clipped(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}\n…[truncated]` : value;
}

/** Best-effort audit logging. A logging failure must never affect delivery. */
export async function recordEmailLog(input: EmailLogInput): Promise<void> {
  try {
    const at = input.at ?? Date.now();
    const id = `${at}-${randomUUID()}`;
    const entry: EmailLogEntry = {
      ...input,
      id,
      at,
      subject: clipped(input.subject, 1_000) || "",
      text: clipped(input.text, 64_000) || "",
      html: clipped(input.html, 192_000),
      error: clipped(input.error, 8_000),
    };
    await kvSet(`${PREFIX}${id}`, JSON.stringify(entry), retentionSeconds);
  } catch (error) {
    console.error("[email-log] failed to record delivery", error);
  }
}

export async function listEmailLogs(filters: DashboardFilters = {}): Promise<EmailLogSnapshot> {
  const keys = filterDashboardKeys(await kvScan(`${PREFIX}*`), PREFIX, filters)
    .sort((a, b) => b.localeCompare(a));
  const truncated = keys.length > MAX_RESULTS;
  const rows = await kvGetManyWithTtl(keys.slice(0, MAX_RESULTS));
  const entries = rows.flatMap(({ value }) => {
    if (!value) return [];
    try {
      const entry = JSON.parse(value) as EmailLogEntry;
      const filterExtension = entry.extension || "unassigned";
      return matchesDashboardFilters(filterExtension, entry.at, filters) ? [entry] : [];
    } catch {
      return [];
    }
  }).sort((a, b) => b.at - a.at);

  const byExtension = new Map<string, { extension: string; name: string; emails: number }>();
  for (const entry of entries) {
    if (!entry.extension) continue;
    const extension = EXTENSIONS.find((item) => item.slug === entry.extension);
    const row = byExtension.get(entry.extension) || {
      extension: entry.extension,
      name: extension?.name || entry.extension,
      emails: 0,
    };
    row.emails += 1;
    byExtension.set(entry.extension, row);
  }
  const sent = entries.filter((entry) => entry.status === "sent").length;
  const rejected = entries.filter((entry) => entry.status === "rejected").length;
  const failed = entries.filter((entry) => entry.status === "failed").length;
  const skipped = entries.filter((entry) => entry.status === "skipped").length;
  const attempted = sent + rejected + failed;

  return {
    fetchedAt: Date.now(),
    storeConfigured,
    retentionDays,
    total: entries.length,
    sent,
    rejected,
    failed,
    skipped,
    deliveryRate: attempted ? Math.round((sent / attempted) * 1_000) / 10 : 0,
    truncated,
    byExtension: [...byExtension.values()].sort((a, b) => b.emails - a.emails || a.name.localeCompare(b.name)),
    entries,
  };
}
