const DAY_MS = 86_400_000;

export interface DashboardFilters {
  extension?: string;
  from?: number;
  to?: number;
}

function epoch(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function dashboardFiltersFromSearchParams(searchParams: URLSearchParams): DashboardFilters {
  const extension = searchParams.get("extension")?.trim() || undefined;
  let from = epoch(searchParams.get("from"));
  let to = epoch(searchParams.get("to"));
  if (from !== undefined && to !== undefined && from > to) [from, to] = [to, from];
  return { extension, from, to };
}

export function matchesDashboardFilters(
  extension: string,
  at: number,
  filters: DashboardFilters,
): boolean {
  if (filters.extension && extension !== filters.extension) return false;
  if (filters.from !== undefined && at < filters.from) return false;
  if (filters.to !== undefined && at > filters.to) return false;
  return true;
}

/** Reduce timestamp-prefixed event keys before fetching their values. */
export function filterDashboardKeys(
  keys: string[],
  prefix: string,
  filters: DashboardFilters,
  lowerPaddingMs = 0,
  upperPaddingMs = 0,
): string[] {
  if (filters.from === undefined && filters.to === undefined) return keys;
  const lower = filters.from === undefined ? Number.NEGATIVE_INFINITY : filters.from - lowerPaddingMs;
  const upper = filters.to === undefined ? Number.POSITIVE_INFINITY : filters.to + upperPaddingMs;
  return keys.filter((key) => {
    const timestamp = Number(key.slice(prefix.length).split(":", 1)[0]);
    return Number.isFinite(timestamp) && timestamp >= lower && timestamp <= upper;
  });
}

function dayKey(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

/**
 * Keep the familiar 14-day chart by default. When a date range is selected,
 * build the chart from that entire range (bounded by the longest retention).
 */
export function dashboardDailySeries<T>(
  events: T[],
  timestamp: (event: T) => number,
  value: (event: T) => number,
  filters: DashboardFilters,
  now = Date.now(),
  retentionDays = 365,
): Array<{ day: string; count: number }> {
  const end = filters.to ?? now;
  const requestedStart = filters.from ?? (
    filters.to !== undefined ? end - (retentionDays - 1) * DAY_MS : now - 13 * DAY_MS
  );
  // Protect the UI from an accidentally enormous query-string range.
  const start = Math.max(requestedStart, end - (retentionDays - 1) * DAY_MS);
  const startDay = Date.parse(`${dayKey(start)}T00:00:00.000Z`);
  const endDay = Date.parse(`${dayKey(end)}T00:00:00.000Z`);
  const daily = new Map<string, number>();

  for (let at = startDay; at <= endDay; at += DAY_MS) daily.set(dayKey(at), 0);
  for (const event of events) {
    const day = dayKey(timestamp(event));
    if (daily.has(day)) daily.set(day, (daily.get(day) ?? 0) + value(event));
  }

  return [...daily].map(([day, count]) => ({ day, count }));
}
