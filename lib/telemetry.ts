import {
  canonicalExtension,
  installationHash,
  prepareCrash,
  saveCrash,
  CRASH_EXTENSION_IDS,
  type CrashEvent,
  type CrashInput,
} from "./crashes";
import { isFunnelEventName, recordFunnelMilestones, type FunnelEventName } from "./funnel";
import { kvDel, kvSetNx } from "./store";

/**
 * Batch ingestion for docs/CONVERSION-FUNNEL.md. One extension queue carries
 * two item kinds, so this endpoint fans them out: funnel milestones update the
 * installation document, automatic errors go through the existing crash
 * pipeline unchanged and appear on the Crashes tab exactly as single-error
 * reports from /api/crash always have.
 */

export const MAX_TELEMETRY_ITEMS = 50;
/** Comfortably longer than any client retry or uninstall-fallback delivery. */
const DEDUPE_TTL_SECONDS = 14 * 86_400;
const ITEM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** A queue can sit through a long offline stretch; a cohort date must survive it. */
const MAX_EVENT_AGE_MS = 60 * 86_400_000;
const MAX_EVENT_SKEW_MS = 300_000;

export interface TelemetryItemInput {
  id?: unknown;
  kind?: unknown;
  name?: unknown;
  at?: unknown;
  [key: string]: unknown;
}

export interface TelemetryBatchInput {
  installationId?: unknown;
  extension?: unknown;
  extensionId?: unknown;
  version?: unknown;
  locale?: unknown;
  platform?: unknown;
  browser?: unknown;
  items?: unknown;
  /** Set by the uninstall page when it replays a pre-baked URL. */
  source?: unknown;
}

export interface PreparedTelemetryBatch {
  extension: string;
  extensionName: string;
  extensionId: string | null;
  installationHash: string | null;
  version: string | null;
  locale: string | null;
  platform: string | null;
  browser: string | null;
  events: Array<{ id: string; name: FunnelEventName; at: number }>;
  errors: Array<{ id: string; input: CrashInput }>;
  /** Malformed items. Acknowledged so a poison item cannot wedge the queue. */
  rejected: Array<{ id: string | null; error: string }>;
}

export interface TelemetryIngestResult {
  acceptedIds: string[];
  rejected: Array<{ id: string | null; error: string }>;
  storedEvents: number;
  storedErrors: number;
  duplicates: number;
  crashEvents: CrashEvent[];
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function itemTime(value: unknown, receivedAt: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return receivedAt;
  if (parsed > receivedAt + MAX_EVENT_SKEW_MS) return receivedAt;
  if (parsed < receivedAt - MAX_EVENT_AGE_MS) return receivedAt - MAX_EVENT_AGE_MS;
  return parsed;
}

export function prepareTelemetryBatch(
  input: TelemetryBatchInput,
): PreparedTelemetryBatch | { error: string } {
  const extensionId = text(input.extensionId, 64).toLowerCase();
  if (extensionId && !/^[a-p]{32}$/.test(extensionId)) return { error: "invalid_extension_id" };

  let extension = canonicalExtension(input.extension);
  if (!extension && extensionId) {
    const slug = CRASH_EXTENSION_IDS.get(extensionId);
    if (slug) extension = canonicalExtension(slug);
  }
  if (!extension) return { error: "unknown_extension" };

  const expectedSlug = extensionId ? CRASH_EXTENSION_IDS.get(extensionId) : undefined;
  if (expectedSlug && expectedSlug !== extension.slug) return { error: "extension_mismatch" };

  const installHash = installationHash(input.installationId);
  if (installHash && typeof installHash === "object") return installHash;

  if (!Array.isArray(input.items)) return { error: "items_required" };
  if (!input.items.length) return { error: "items_required" };
  if (input.items.length > MAX_TELEMETRY_ITEMS) return { error: "too_many_items" };

  const version = text(input.version, 40) || null;
  const locale = text(input.locale, 30) || null;
  const platform = text(input.platform, 80) || null;
  const browser = text(input.browser, 80) || null;
  const receivedAt = Date.now();

  const events: PreparedTelemetryBatch["events"] = [];
  const errors: PreparedTelemetryBatch["errors"] = [];
  const rejected: PreparedTelemetryBatch["rejected"] = [];
  const seen = new Set<string>();

  for (const raw of input.items as TelemetryItemInput[]) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      rejected.push({ id: null, error: "invalid_item" });
      continue;
    }
    const id = text(raw.id, 64);
    if (!ITEM_ID_PATTERN.test(id)) {
      rejected.push({ id: id || null, error: "invalid_item_id" });
      continue;
    }
    // A batch repeating an ID would otherwise claim the dedupe marker once and
    // silently drop the rest of its own items.
    if (seen.has(id)) {
      rejected.push({ id, error: "duplicate_item_id" });
      continue;
    }
    seen.add(id);

    const kind = text(raw.kind, 20);
    const at = itemTime(raw.at, receivedAt);

    if (kind === "event") {
      const name = text(raw.name, 60);
      // Reserved for verified website fulfillment; an extension may never emit it.
      if (name === "purchase_completed") {
        rejected.push({ id, error: "purchase_completed_is_server_only" });
        continue;
      }
      if (!isFunnelEventName(name)) {
        rejected.push({ id, error: "unknown_event" });
        continue;
      }
      if (!installHash) {
        rejected.push({ id, error: "installation_id_required" });
        continue;
      }
      events.push({ id, name, at });
      continue;
    }

    if (kind === "error") {
      const name = text(raw.name, 100) || "Error";
      const code = text(raw.code, 100);
      // The pre-baked uninstall fallback carries only { id, name, at }, so the
      // stable code stands in for the message rather than dropping the report.
      const message = text(raw.message, 1_000) || code || name;
      errors.push({
        id,
        input: {
          extension: extension.slug,
          extensionId: extensionId || undefined,
          installationId: input.installationId,
          version,
          locale,
          platform,
          browser,
          source: raw.source ?? input.source,
          name,
          code: code || undefined,
          message,
          stack: raw.stack,
          file: raw.file,
          line: raw.line,
          column: raw.column,
          context: raw.context,
          breadcrumbs: raw.breadcrumbs,
          occurredAt: at,
          suppressedCount: raw.suppressedCount,
        },
      });
      continue;
    }

    rejected.push({ id, error: "unknown_item_kind" });
  }

  return {
    extension: extension.slug,
    extensionName: extension.name,
    extensionId: extensionId || null,
    installationHash: installHash,
    version,
    locale,
    platform,
    browser,
    events,
    errors,
    rejected,
  };
}

function dedupeKey(batch: PreparedTelemetryBatch, itemId: string): string {
  const scope = batch.installationHash ?? `anon:${batch.extension}`;
  return `telemetry:item:${scope}:${itemId}`;
}

/**
 * Claim each item ID before storing it. A claim that is not followed by a
 * successful write is released, so a storage failure leaves the client free to
 * retry the same IDs rather than having them permanently swallowed.
 */
export async function ingestTelemetryBatch(
  batch: PreparedTelemetryBatch,
): Promise<TelemetryIngestResult> {
  const claimed: string[] = [];
  const acceptedIds = batch.rejected.flatMap((item) => (item.id ? [item.id] : []));
  const freshEvents: PreparedTelemetryBatch["events"] = [];
  const freshErrors: PreparedTelemetryBatch["errors"] = [];
  let duplicates = 0;

  const claim = async (itemId: string): Promise<boolean> => {
    const key = dedupeKey(batch, itemId);
    const isNew = await kvSetNx(key, String(Date.now()), DEDUPE_TTL_SECONDS).catch(() => true);
    if (!isNew) {
      // Already stored by an earlier delivery. Acknowledge so the client drops
      // it; re-storing would double-count occurrences on the Crashes tab.
      duplicates++;
      acceptedIds.push(itemId);
      return false;
    }
    claimed.push(key);
    return true;
  };

  for (const item of batch.events) if (await claim(item.id)) freshEvents.push(item);
  for (const item of batch.errors) if (await claim(item.id)) freshErrors.push(item);

  const crashEvents: CrashEvent[] = [];
  try {
    if (freshEvents.length && batch.installationHash) {
      await recordFunnelMilestones({
        extension: batch.extension,
        extensionName: batch.extensionName,
        installationHash: batch.installationHash,
        version: batch.version,
        locale: batch.locale,
        events: freshEvents.map(({ name, at }) => ({ name, at })),
      });
      acceptedIds.push(...freshEvents.map((item) => item.id));
    }

    for (const item of freshErrors) {
      const event = prepareCrash(item.input);
      if ("error" in event) {
        // Invalid content, not an outage: acknowledge and record why.
        batch.rejected.push({ id: item.id, error: event.error });
        acceptedIds.push(item.id);
        continue;
      }
      await saveCrash(event);
      crashEvents.push(event);
      acceptedIds.push(item.id);
    }
  } catch (error) {
    await Promise.all(claimed.map((key) => kvDel(key).catch(() => {})));
    throw error;
  }

  return {
    acceptedIds,
    rejected: batch.rejected,
    storedEvents: freshEvents.length,
    storedErrors: crashEvents.length,
    duplicates,
    crashEvents,
  };
}
