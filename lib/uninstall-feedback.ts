import { EXTENSIONS, getExtension } from "./extensions";
import { dashboardDailySeries, filterDashboardKeys, matchesDashboardFilters, type DashboardFilters } from "./dashboard-filters";
import { kvGetManyWithTtl, kvScan, storeConfigured } from "./store";

const EVENT_PREFIX = "uninstall-feedback:";
const RATE_PREFIX = "uninstall-feedback:rate:";
const MAX_DASHBOARD_EVENTS = 5_000;

export const UNINSTALL_REASON_LABELS = {
  not_working: "It didn’t work",
  hard_to_use: "It was difficult to use",
  too_slow: "It was too slow",
  missing_feature: "A feature was missing",
  price: "It was too expensive",
  privacy: "Privacy or permissions",
  one_time: "I don’t need it anymore",
  mistake: "Installed by mistake",
  switched_tool: "Switched to another tool",
  other: "Something else",
} as const;

export type UninstallReason = keyof typeof UNINSTALL_REASON_LABELS;

export function isUninstallReason(value: string): value is UninstallReason {
  return value in UNINSTALL_REASON_LABELS;
}

export interface UninstallFeedbackEvent {
  id: string;
  extension: string;
  extensionName: string;
  version: string;
  reason: UninstallReason;
  /** Always English so answers aggregate across localized survey pages. */
  reasonLabel: string;
  /** Kept verbatim in the language entered by the user. */
  comment: string | null;
  locale: string | null;
  receivedAt: number;
}

export interface UninstallFeedbackSnapshot {
  storeConfigured: boolean;
  fetchedAt: number;
  retentionDays: number;
  totalResponses: number;
  last24Hours: number;
  last7Days: number;
  withComments: number;
  truncated: boolean;
  byReason: Array<{ reason: UninstallReason; label: string; count: number }>;
  comparison: {
    from: number;
    to: number;
    totalResponses: number;
    withComments: number;
    byReason: Array<{ reason: UninstallReason; label: string; count: number }>;
  } | null;
  byExtension: Array<{
    extension: string;
    name: string;
    responses: number;
    withComments: number;
    lastReceived: number | null;
    versions: string[];
  }>;
  daily: Array<{ day: string; count: number }>;
  events: UninstallFeedbackEvent[];
}

function summarizeReasons(events: UninstallFeedbackEvent[]) {
  const counts = new Map<UninstallReason, number>(
    Object.keys(UNINSTALL_REASON_LABELS).map((reason) => [reason as UninstallReason, 0]),
  );
  for (const event of events) counts.set(event.reason, (counts.get(event.reason) ?? 0) + 1);
  return [...counts].map(([reason, count]) => ({ reason, label: UNINSTALL_REASON_LABELS[reason], count }));
}

function previousPeriod(filters: DashboardFilters): { from: number; to: number } | null {
  if (!filters.from || !filters.to || filters.to <= filters.from) return null;
  const duration = filters.to - filters.from;
  return { from: filters.from - duration, to: filters.from - 1 };
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function eventTime(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeFeedback(value: string): UninstallFeedbackEvent | null {
  try {
    const input = JSON.parse(value) as Record<string, unknown>;
    const extension = clean(input.extension, 60);
    const reason = clean(input.reason, 40);
    const receivedAt = eventTime(input.receivedAt);
    const known = getExtension(extension);
    if (!known || !isUninstallReason(reason) || !receivedAt) return null;
    return {
      id: clean(input.id, 80) || `${extension}:${receivedAt}`,
      extension: known.slug,
      extensionName: known.shortName,
      version: clean(input.version, 40) || "unknown",
      reason,
      reasonLabel: UNINSTALL_REASON_LABELS[reason],
      comment: clean(input.comment, 1_000) || null,
      locale: clean(input.locale, 30) || null,
      receivedAt,
    };
  } catch {
    return null;
  }
}

export async function listUninstallFeedback(filters: DashboardFilters = {}): Promise<UninstallFeedbackSnapshot> {
  const keys = (await kvScan(`${EVENT_PREFIX}*`))
    .filter((key) => !key.startsWith(RATE_PREFIX))
    .sort()
    .reverse();
  // Apply extension/date filters before capping the dashboard result so a
  // sparse product is not hidden by newer feedback for other extensions.
  const previous = previousPeriod(filters);
  const readFilters = previous ? { ...filters, from: previous.from } : filters;
  const candidateKeys = filterDashboardKeys(keys, EVENT_PREFIX, readFilters);
  const rows = await kvGetManyWithTtl(candidateKeys);
  const retainedEvents = rows
    .flatMap(({ value }) => value ? [normalizeFeedback(value)] : [])
    .filter((event): event is UninstallFeedbackEvent => Boolean(event))
    .sort((a, b) => b.receivedAt - a.receivedAt);
  const matchingEvents = retainedEvents.filter((event) =>
    matchesDashboardFilters(event.extension, event.receivedAt, filters),
  );
  const events = matchingEvents.slice(0, MAX_DASHBOARD_EVENTS);
  const previousEvents = previous
    ? retainedEvents.filter((event) =>
      matchesDashboardFilters(event.extension, event.receivedAt, {
        extension: filters.extension,
        from: previous.from,
        to: previous.to,
      }),
    ).slice(0, MAX_DASHBOARD_EVENTS)
    : [];

  const extensionRows = new Map(
    EXTENSIONS.filter((extension) => !filters.extension || extension.slug === filters.extension).map((extension) => [extension.slug, {
      extension: extension.slug,
      name: extension.shortName,
      responses: 0,
      withComments: 0,
      lastReceived: null as number | null,
      versions: [] as string[],
    }]),
  );
  for (const event of events) {
    const row = extensionRows.get(event.extension);
    if (!row) continue;
    row.responses++;
    if (event.comment) row.withComments++;
    row.lastReceived = Math.max(row.lastReceived ?? 0, event.receivedAt);
    if (!row.versions.includes(event.version)) row.versions.push(event.version);
  }

  const now = Date.now();
  const daily = dashboardDailySeries(events, (event) => event.receivedAt, () => 1, filters, now, 180);

  return {
    storeConfigured,
    fetchedAt: now,
    retentionDays: 180,
    totalResponses: events.length,
    last24Hours: events.filter((event) => event.receivedAt >= now - 86_400_000).length,
    last7Days: events.filter((event) => event.receivedAt >= now - 7 * 86_400_000).length,
    withComments: events.filter((event) => Boolean(event.comment)).length,
    truncated: matchingEvents.length > events.length,
    byReason: summarizeReasons(events),
    comparison: previous ? {
      from: previous.from,
      to: previous.to,
      totalResponses: previousEvents.length,
      withComments: previousEvents.filter((event) => Boolean(event.comment)).length,
      byReason: summarizeReasons(previousEvents),
    } : null,
    byExtension: [...extensionRows.values()].sort((a, b) => b.responses - a.responses || a.name.localeCompare(b.name)),
    daily,
    events,
  };
}
