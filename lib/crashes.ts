import { createHash, createHmac, randomUUID } from "node:crypto";
import { EXTENSIONS, getExtension } from "./extensions";
import { mailConfigured, sendCrashAlert, type CrashAlert } from "./mail";
import {
  kvDel,
  kvGetManyWithTtl,
  kvIncrementWithTtl,
  kvScan,
  kvSet,
  kvSetNx,
  storeConfigured,
} from "./store";

const EVENT_PREFIX = "crash:event:";
const DEFAULT_RETENTION_DAYS = 90;
const MAX_DASHBOARD_EVENTS = 5_000;
const SPIKE_WINDOW_SECONDS = 15 * 60;
const DEFAULT_SPIKE_INSTALLATIONS = 3;

export const EXTRA_CRASH_EXTENSIONS = [
  { slug: "instagram-dm-cleaner", name: "DM Cleaner — Instagram Messages" },
] as const;

export interface CrashInput {
  extension?: unknown;
  extensionId?: unknown;
  installationId?: unknown;
  version?: unknown;
  source?: unknown;
  name?: unknown;
  code?: unknown;
  message?: unknown;
  stack?: unknown;
  locale?: unknown;
  platform?: unknown;
  occurredAt?: unknown;
  /** Repeats suppressed by the client since its previous sent report. */
  suppressedCount?: unknown;
}

export interface CrashEvent {
  id: string;
  fingerprint: string;
  extension: string;
  extensionName: string;
  extensionId: string | null;
  /** One-way server hash; the submitted installation UUID is never stored. */
  installationHash: string | null;
  version: string;
  source: string;
  name: string;
  code: string | null;
  message: string;
  stack: string | null;
  locale: string | null;
  platform: string | null;
  occurredAt: number;
  receivedAt: number;
  /** This report plus equivalent occurrences suppressed on the client. */
  occurrences: number;
}

export interface CrashIssue {
  fingerprint: string;
  extension: string;
  extensionName: string;
  name: string;
  code: string | null;
  message: string;
  count: number;
  reports: number;
  affectedInstallations: number;
  firstSeen: number;
  lastSeen: number;
  versions: string[];
  sources: string[];
  recent: CrashEvent[];
}

export interface CrashSnapshot {
  storeConfigured: boolean;
  fetchedAt: number;
  retentionDays: number;
  totalEvents: number;
  totalOccurrences: number;
  affectedInstallations: number;
  uniqueIssues: number;
  last24Hours: number;
  last7Days: number;
  truncated: boolean;
  byExtension: Array<{
    extension: string;
    name: string;
    events: number;
    reports: number;
    affectedInstallations: number;
    issues: number;
    lastSeen: number;
    versions: string[];
  }>;
  daily: Array<{ day: string; count: number }>;
  issues: CrashIssue[];
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeDiagnostic(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:bearer\s+)?[A-Za-z0-9_-]{32,}\b/gi, "[redacted-token]")
    .replace(/https?:\/\/([^/\s?#]+)[^\s)]*/gi, "https://$1/[redacted]");
}

function canonicalExtension(value: unknown): { slug: string; name: string } | null {
  const slug = text(value, 80).toLowerCase();
  const known = getExtension(slug);
  if (known) return { slug: known.slug, name: known.shortName };
  const extra = EXTRA_CRASH_EXTENSIONS.find((item) => item.slug === slug);
  return extra ? { slug: extra.slug, name: extra.name } : null;
}

export const CRASH_EXTENSION_IDS = new Map(
  EXTENSIONS.map((extension) => [extension.storeId, extension.slug]),
);

function eventTime(value: unknown, receivedAt: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Date.parse(value)
        : Number.NaN;
  // Delayed service workers are expected, but reject wildly stale/future clocks.
  return Number.isFinite(parsed) && parsed >= receivedAt - 7 * 86_400_000 && parsed <= receivedAt + 300_000
    ? parsed
    : receivedAt;
}

function normalizedFingerprintPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/chrome-extension:\/\/[a-p]{32}/g, "chrome-extension://[id]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/g, "[uuid]")
    .replace(/\b0x[0-9a-f]+\b/g, "[hex]")
    .replace(/:\d+:\d+/g, ":[line]:[column]")
    .replace(/\b\d{3,}\b/g, "[number]");
}

function installationHash(value: unknown): string | null | { error: string } {
  const id = text(value, 80).toLowerCase();
  if (!id) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) {
    return { error: "invalid_installation_id" };
  }
  const salt = process.env.CRASH_INSTALLATION_SALT || "cleanmysocial-crash-installation-v1";
  return createHmac("sha256", salt).update(id).digest("hex").slice(0, 24);
}

function occurrencesFrom(input: CrashInput): number {
  const suppressed = Number(input.suppressedCount);
  return 1 + (Number.isInteger(suppressed) ? Math.max(0, Math.min(999, suppressed)) : 0);
}

export function prepareCrash(input: CrashInput): CrashEvent | { error: string } {
  const extensionId = text(input.extensionId, 64).toLowerCase();
  if (extensionId && !/^[a-p]{32}$/.test(extensionId)) {
    return { error: "invalid_extension_id" };
  }
  let extension = canonicalExtension(input.extension);
  if (!extension && extensionId) {
    const slug = CRASH_EXTENSION_IDS.get(extensionId);
    if (slug) extension = canonicalExtension(slug);
  }
  if (!extension) return { error: "unknown_extension" };

  const expectedSlug = extensionId ? CRASH_EXTENSION_IDS.get(extensionId) : undefined;
  if (expectedSlug && expectedSlug !== extension.slug) {
    return { error: "extension_mismatch" };
  }

  const installHash = installationHash(input.installationId);
  if (installHash && typeof installHash === "object") return installHash;

  const message = safeDiagnostic(text(input.message, 1_000));
  if (!message) return { error: "message_required" };

  const receivedAt = Date.now();
  const name = safeDiagnostic(text(input.name, 100)) || "Error";
  const code = safeDiagnostic(text(input.code, 100)) || null;
  const stack = safeDiagnostic(text(input.stack, 6_000)) || null;
  const source = safeDiagnostic(text(input.source, 100)) || "unknown";
  const fingerprint = createHash("sha256")
    .update(
      [extension.slug, name, code ?? "", normalizedFingerprintPart(message), normalizedFingerprintPart(stack?.split("\n")[1] ?? "")].join("\n"),
    )
    .digest("hex")
    .slice(0, 16);

  return {
    id: randomUUID(),
    fingerprint,
    extension: extension.slug,
    extensionName: extension.name,
    extensionId: extensionId || null,
    installationHash: installHash,
    version: safeDiagnostic(text(input.version, 40)) || "unknown",
    source,
    name,
    code,
    message,
    stack,
    locale: safeDiagnostic(text(input.locale, 30)) || null,
    platform: safeDiagnostic(text(input.platform, 80)) || null,
    occurredAt: eventTime(input.occurredAt, receivedAt),
    receivedAt,
    occurrences: occurrencesFrom(input),
  };
}

export function crashRetentionDays(): number {
  const configured = Number(process.env.CRASH_RETENTION_DAYS);
  return Number.isInteger(configured) && configured >= 1 && configured <= 365
    ? configured
    : DEFAULT_RETENTION_DAYS;
}

export async function saveCrash(event: CrashEvent): Promise<void> {
  const ttl = crashRetentionDays() * 86_400;
  const timestamp = String(event.receivedAt).padStart(13, "0");
  await kvSet(`${EVENT_PREFIX}${timestamp}:${event.id}`, JSON.stringify(event), ttl);
}

function spikeThreshold(): number {
  const configured = Number(process.env.CRASH_SPIKE_INSTALLATIONS);
  return Number.isInteger(configured) && configured >= 2 && configured <= 100
    ? configured
    : DEFAULT_SPIKE_INSTALLATIONS;
}

async function sendAlertOnce(key: string, ttlSeconds: number, alert: CrashAlert): Promise<boolean> {
  if (!mailConfigured || process.env.CRASH_ALERTS_ENABLED === "false") return false;
  const claimed = await kvSetNx(key, "pending", ttlSeconds);
  if (!claimed) return false;
  const sent = await sendCrashAlert(alert);
  if (!sent) await kvDel(key).catch(() => {});
  else await kvSet(key, String(Date.now()), ttlSeconds);
  return sent;
}

/**
 * Notify on a fingerprint's first appearance in a version, and when the same
 * issue reaches the distinct-installation threshold inside a 15-minute bucket.
 * Alert failures never affect crash ingestion.
 */
export async function maybeSendCrashAlerts(event: CrashEvent): Promise<void> {
  // Endpoint smoke tests should verify storage/dashboard behavior without
  // paging the developer as if a released product regressed.
  if (event.version === "test" || event.source === "manual-smoke-test") return;
  const common = {
    extension: event.extension,
    extensionName: event.extensionName,
    version: event.version,
    fingerprint: event.fingerprint,
    name: event.name,
    code: event.code,
    message: event.message,
    source: event.source,
  };
  const alertTtl = crashRetentionDays() * 86_400;
  await sendAlertOnce(
    `crash:alert:new:${event.extension}:${event.version}:${event.fingerprint}`,
    alertTtl,
    { ...common, kind: "new_issue", affectedInstallations: event.installationHash ? 1 : 0 },
  );

  if (!event.installationHash) return;
  const bucket = Math.floor(event.receivedAt / (SPIKE_WINDOW_SECONDS * 1000));
  const scope = `${event.extension}:${event.version}:${event.fingerprint}:${bucket}`;
  const firstInWindow = await kvSetNx(
    `crash:spike:install:${scope}:${event.installationHash}`,
    "1",
    SPIKE_WINDOW_SECONDS * 2,
  );
  if (!firstInWindow) return;
  const affected = await kvIncrementWithTtl(
    `crash:spike:count:${scope}`,
    SPIKE_WINDOW_SECONDS * 2,
  );
  if (affected < spikeThreshold()) return;
  await sendAlertOnce(
    `crash:alert:spike:${scope}`,
    SPIKE_WINDOW_SECONDS * 2,
    {
      ...common,
      kind: "spike",
      affectedInstallations: affected,
      windowMinutes: SPIKE_WINDOW_SECONDS / 60,
    },
  );
}

function eventOccurrences(event: CrashEvent): number {
  return Number.isInteger(event.occurrences) && event.occurrences > 0 ? event.occurrences : 1;
}

function dayKey(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

export async function listCrashes(): Promise<CrashSnapshot> {
  const keys = (await kvScan(`${EVENT_PREFIX}*`)).sort().reverse();
  const selected = keys.slice(0, MAX_DASHBOARD_EVENTS);
  const rows = await kvGetManyWithTtl(selected);
  const events = rows
    .map(({ value }) => {
      try {
        return value ? (JSON.parse(value) as CrashEvent) : null;
      } catch {
        return null;
      }
    })
    .filter((event): event is CrashEvent => Boolean(event?.fingerprint && event?.extension))
    .sort((a, b) => b.occurredAt - a.occurredAt);

  const issueMap = new Map<string, CrashIssue>();
  const issueInstallations = new Map<string, Set<string>>();
  for (const event of events) {
    const key = `${event.extension}:${event.fingerprint}`;
    if (event.installationHash) {
      const installations = issueInstallations.get(key) ?? new Set<string>();
      installations.add(event.installationHash);
      issueInstallations.set(key, installations);
    }
    const issue = issueMap.get(key);
    if (!issue) {
      issueMap.set(key, {
        fingerprint: event.fingerprint,
        extension: event.extension,
        extensionName: event.extensionName,
        name: event.name,
        code: event.code,
        message: event.message,
        count: eventOccurrences(event),
        reports: 1,
        affectedInstallations: 0,
        firstSeen: event.occurredAt,
        lastSeen: event.occurredAt,
        versions: [event.version],
        sources: [event.source],
        recent: [event],
      });
      continue;
    }
    issue.count += eventOccurrences(event);
    issue.reports++;
    issue.firstSeen = Math.min(issue.firstSeen, event.occurredAt);
    issue.lastSeen = Math.max(issue.lastSeen, event.occurredAt);
    if (!issue.versions.includes(event.version)) issue.versions.push(event.version);
    if (!issue.sources.includes(event.source)) issue.sources.push(event.source);
    if (issue.recent.length < 10) issue.recent.push(event);
  }

  for (const [key, issue] of issueMap) {
    issue.affectedInstallations = issueInstallations.get(key)?.size ?? 0;
  }

  const issues = [...issueMap.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  const extensionMap = new Map<string, CrashSnapshot["byExtension"][number]>();
  const extensionInstallations = new Map<string, Set<string>>();
  for (const event of events) {
    const row = extensionMap.get(event.extension) ?? {
      extension: event.extension,
      name: event.extensionName,
      events: 0,
      reports: 0,
      affectedInstallations: 0,
      issues: 0,
      lastSeen: 0,
      versions: [],
    };
    row.events += eventOccurrences(event);
    row.reports++;
    row.lastSeen = Math.max(row.lastSeen, event.occurredAt);
    if (!row.versions.includes(event.version)) row.versions.push(event.version);
    extensionMap.set(event.extension, row);
    if (event.installationHash) {
      const installations = extensionInstallations.get(event.extension) ?? new Set<string>();
      installations.add(event.installationHash);
      extensionInstallations.set(event.extension, installations);
    }
  }
  for (const issue of issues) extensionMap.get(issue.extension)!.issues++;
  for (const [extension, row] of extensionMap) {
    row.affectedInstallations = extensionInstallations.get(extension)?.size ?? 0;
  }

  const now = Date.now();
  const dailyMap = new Map<string, number>();
  for (let offset = 13; offset >= 0; offset--) {
    dailyMap.set(dayKey(now - offset * 86_400_000), 0);
  }
  for (const event of events) {
    const day = dayKey(event.occurredAt);
    if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + eventOccurrences(event));
  }

  const totalOccurrences = events.reduce((total, event) => total + eventOccurrences(event), 0);
  const allInstallations = new Set(events.flatMap((event) => event.installationHash ? [event.installationHash] : []));

  return {
    storeConfigured,
    fetchedAt: now,
    retentionDays: crashRetentionDays(),
    totalEvents: events.length,
    totalOccurrences,
    affectedInstallations: allInstallations.size,
    uniqueIssues: issues.length,
    last24Hours: events
      .filter((event) => event.occurredAt >= now - 86_400_000)
      .reduce((total, event) => total + eventOccurrences(event), 0),
    last7Days: events
      .filter((event) => event.occurredAt >= now - 7 * 86_400_000)
      .reduce((total, event) => total + eventOccurrences(event), 0),
    truncated: keys.length > selected.length,
    byExtension: [...extensionMap.values()].sort((a, b) => b.events - a.events),
    daily: [...dailyMap].map(([day, count]) => ({ day, count })),
    issues,
  };
}
