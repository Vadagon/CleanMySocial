import { getExtension } from "./extensions";
import { dashboardDailySeries, type DashboardFilters } from "./dashboard-filters";
import { kvGetManyWithTtl, kvScan, kvSet, storeConfigured } from "./store";

/**
 * Conversion Funnel storage, written by /api/telemetry and read by the Funnel
 * tab on /crash.
 *
 * Crashes are stored one row per report because each occurrence matters.
 * Funnel milestones are the opposite: every milestone is count-once per
 * installation, and every question the dashboard asks ("how many distinct
 * installations reached step 3?") is a question about installations, not
 * events. So the durable unit here is one document per installation holding
 * the earliest timestamp of each milestone. That makes a retried or re-baked
 * item idempotent by construction — re-applying it writes the same minimum —
 * and makes install-cohort selection a field read rather than a join.
 */

const INSTALL_PREFIX = "funnel:install:";
const PURCHASE_PREFIX = "purchase:creem:";
const DEFAULT_RETENTION_DAYS = 90;
const MAX_DASHBOARD_INSTALLATIONS = 20_000;
const DAY_MS = 86_400_000;
/** Conversions keep arriving after a cohort's install date. */
const COHORT_SETTLING_MS = 7 * DAY_MS;

/** The ordered paid funnel. `purchase_completed` is step 6 and never extension-sent. */
export const FUNNEL_STEPS = [
  "installed",
  "first_action_started",
  "first_action_succeeded",
  "free_cap_reached",
  "get_pro_clicked",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export const FUNNEL_EVENT_NAMES = [...FUNNEL_STEPS, "review_link_clicked"] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

export const FUNNEL_EVENT_LABELS: Record<FunnelEventName, string> = {
  installed: "Installed",
  first_action_started: "First action started",
  first_action_succeeded: "First action succeeded",
  free_cap_reached: "Free cap reached",
  get_pro_clicked: "Get Pro clicked",
  review_link_clicked: "Review link clicked",
};

export function isFunnelEventName(value: unknown): value is FunnelEventName {
  return typeof value === "string" && (FUNNEL_EVENT_NAMES as readonly string[]).includes(value);
}

export interface FunnelInstallation {
  extension: string;
  extensionName: string;
  /** Same one-way hash the crash store uses, so the two views describe one installation. */
  installationHash: string;
  /** Earliest recorded occurrence of each milestone. */
  milestones: Partial<Record<FunnelEventName, number>>;
  versions: string[];
  locales: string[];
  firstSeen: number;
  updatedAt: number;
}

export interface FunnelStepRow {
  step: number;
  name: FunnelStep | "purchase_completed";
  label: string;
  users: number;
  /** Share of the previous step that reached this one. */
  conversionFromPrevious: number;
  conversionFromInstall: number;
  dropOff: number;
  /** True for the step that is not joined to an installation. */
  unattributed: boolean;
}

export interface FunnelSnapshot {
  storeConfigured: boolean;
  fetchedAt: number;
  retentionDays: number;
  view: FunnelView;
  /** Recent cohorts still gain conversions; totals below are not final. */
  cohortIncomplete: boolean;
  truncated: boolean;
  installations: number;
  /** Documents that never recorded `installed` and cannot join a cohort. */
  withoutInstallEvent: number;
  steps: FunnelStepRow[];
  averageStepsCompleted: number;
  reviewClicks: { users: number; eligible: number };
  purchases: { fulfillments: number; attributed: false };
  versions: string[];
  locales: string[];
  byExtension: Array<{
    extension: string;
    name: string;
    installations: number;
    firstSuccess: number;
    capReached: number;
    proClicked: number;
    fulfillments: number;
  }>;
  daily: Array<{ day: string; count: number }>;
}

export type FunnelView = "cohort" | "activity";

export interface FunnelFilters extends DashboardFilters {
  version?: string;
  locale?: string;
  view?: FunnelView;
}

export function funnelRetentionDays(): number {
  const configured = Number(process.env.FUNNEL_RETENTION_DAYS);
  return Number.isInteger(configured) && configured >= 1 && configured <= 365
    ? configured
    : DEFAULT_RETENTION_DAYS;
}

function installKey(extension: string, installationHash: string): string {
  return `${INSTALL_PREFIX}${extension}:${installationHash}`;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function bounded(list: string[], max: number): string[] {
  return [...new Set(list.filter(Boolean))].slice(0, max);
}

function parseInstallation(value: string): FunnelInstallation | null {
  try {
    const parsed = JSON.parse(value) as Partial<FunnelInstallation>;
    const extension = text(parsed.extension, 80);
    const installationHash = text(parsed.installationHash, 64);
    if (!extension || !installationHash || !parsed.milestones) return null;
    const milestones: Partial<Record<FunnelEventName, number>> = {};
    for (const [name, at] of Object.entries(parsed.milestones)) {
      if (isFunnelEventName(name) && typeof at === "number" && Number.isFinite(at)) {
        milestones[name] = at;
      }
    }
    return {
      extension,
      extensionName: text(parsed.extensionName, 120) || getExtension(extension)?.shortName || extension,
      installationHash,
      milestones,
      versions: Array.isArray(parsed.versions) ? parsed.versions.filter((item): item is string => typeof item === "string") : [],
      locales: Array.isArray(parsed.locales) ? parsed.locales.filter((item): item is string => typeof item === "string") : [],
      firstSeen: Number(parsed.firstSeen) || 0,
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Merge one batch's milestones into an installation document.
 *
 * Read-modify-write: two batches from the same installation arriving at once
 * can lose the loser's milestones. Every milestone is count-once and the
 * client keeps unacknowledged items queued, so the next flush re-applies them;
 * a lock here would cost a round trip on every ingest to protect against a
 * race that self-heals.
 */
export async function recordFunnelMilestones(input: {
  extension: string;
  extensionName: string;
  installationHash: string;
  version?: string | null;
  locale?: string | null;
  events: Array<{ name: FunnelEventName; at: number }>;
}): Promise<void> {
  if (!input.events.length) return;
  const key = installKey(input.extension, input.installationHash);
  const [row] = await kvGetManyWithTtl([key]);
  const existing = row?.value ? parseInstallation(row.value) : null;
  const now = Date.now();
  const milestones = { ...(existing?.milestones ?? {}) };

  for (const event of input.events) {
    const current = milestones[event.name];
    // Earliest occurrence wins, so a delayed upload never moves a milestone.
    if (current === undefined || event.at < current) milestones[event.name] = event.at;
  }

  const document: FunnelInstallation = {
    extension: input.extension,
    extensionName: input.extensionName,
    installationHash: input.installationHash,
    milestones,
    versions: bounded([...(existing?.versions ?? []), text(input.version, 40)], 20),
    locales: bounded([...(existing?.locales ?? []), text(input.locale, 30)], 10),
    firstSeen: existing?.firstSeen || Math.min(now, ...input.events.map((event) => event.at)),
    updatedAt: now,
  };

  await kvSet(key, JSON.stringify(document), funnelRetentionDays() * 86_400);
}

function matchesMetadata(installation: FunnelInstallation, filters: FunnelFilters): boolean {
  if (filters.extension && installation.extension !== filters.extension) return false;
  if (filters.version && !installation.versions.includes(filters.version)) return false;
  if (filters.locale && !installation.locales.includes(filters.locale)) return false;
  return true;
}

function inRange(at: number | undefined, filters: FunnelFilters): boolean {
  if (at === undefined) return false;
  if (filters.from !== undefined && at < filters.from) return false;
  if (filters.to !== undefined && at > filters.to) return false;
  return true;
}

/**
 * Verified website fulfillments. Step 6 is deliberately NOT joined to an
 * installation: no attribution token exists yet, and inferring one from a
 * license key would turn licensing data into analytics. It is counted inside
 * the selected period and labelled as a website total.
 */
async function countFulfillments(filters: FunnelFilters): Promise<{ total: number; byExtension: Map<string, number> }> {
  const keys = await kvScan(`${PURCHASE_PREFIX}*`);
  const rows = await kvGetManyWithTtl(keys);
  const byExtension = new Map<string, number>();
  let total = 0;

  for (const { value } of rows) {
    if (!value) continue;
    try {
      const parsed = JSON.parse(value) as { extensionSlugs?: unknown; updatedAt?: unknown };
      const at = Number(parsed.updatedAt);
      if (!Number.isFinite(at)) continue;
      if (filters.from !== undefined && at < filters.from) continue;
      if (filters.to !== undefined && at > filters.to) continue;
      const slugs = Array.isArray(parsed.extensionSlugs)
        ? parsed.extensionSlugs.filter((slug): slug is string => typeof slug === "string")
        : [];
      if (filters.extension && !slugs.includes(filters.extension)) continue;
      total++;
      for (const slug of slugs) byExtension.set(slug, (byExtension.get(slug) ?? 0) + 1);
    } catch {
      // A malformed audit record must not hide the funnel.
    }
  }

  return { total, byExtension };
}

function share(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

export async function listFunnel(filters: FunnelFilters = {}): Promise<FunnelSnapshot> {
  const view: FunnelView = filters.view === "activity" ? "activity" : "cohort";
  const pattern = filters.extension
    ? `${INSTALL_PREFIX}${filters.extension}:*`
    : `${INSTALL_PREFIX}*`;
  const keys = (await kvScan(pattern)).sort();
  const truncated = keys.length > MAX_DASHBOARD_INSTALLATIONS;
  const rows = await kvGetManyWithTtl(keys.slice(0, MAX_DASHBOARD_INSTALLATIONS));
  const retained = rows
    .flatMap(({ value }) => (value ? [parseInstallation(value)] : []))
    .filter((item): item is FunnelInstallation => Boolean(item));
  const matching = retained.filter((installation) => matchesMetadata(installation, filters));

  // The install cohort is the default because it answers "of the people who
  // arrived in this period, how far did they get?". The activity view counts
  // milestones that happened in the period, which is useful but is not a
  // funnel: an install from March can click Get Pro today.
  const cohort = view === "cohort"
    ? matching.filter((installation) => inRange(installation.milestones.installed, filters))
    : matching;
  const withoutInstallEvent = matching.filter((installation) => installation.milestones.installed === undefined).length;

  const reached = (name: FunnelEventName): number =>
    view === "cohort"
      ? cohort.filter((installation) => installation.milestones[name] !== undefined).length
      : cohort.filter((installation) => inRange(installation.milestones[name], filters)).length;

  const stepUsers = FUNNEL_STEPS.map((name) => reached(name));
  const installations = stepUsers[0];
  const fulfillments = await countFulfillments(filters);

  const steps: FunnelStepRow[] = FUNNEL_STEPS.map((name, index) => {
    const users = stepUsers[index];
    const previous = index === 0 ? users : stepUsers[index - 1];
    return {
      step: index + 1,
      name,
      label: FUNNEL_EVENT_LABELS[name],
      users,
      conversionFromPrevious: index === 0 ? 1 : share(users, previous),
      conversionFromInstall: share(users, installations),
      dropOff: index === 0 ? 0 : Math.max(0, previous - users),
      unattributed: false,
    };
  });

  const lastStepUsers = stepUsers[stepUsers.length - 1];
  steps.push({
    step: 6,
    name: "purchase_completed",
    label: "Purchase completed",
    users: fulfillments.total,
    conversionFromPrevious: share(fulfillments.total, lastStepUsers),
    conversionFromInstall: share(fulfillments.total, installations),
    dropOff: Math.max(0, lastStepUsers - fulfillments.total),
    unattributed: true,
  });

  const reachedByExtension = new Map<string, FunnelSnapshot["byExtension"][number]>();
  for (const installation of cohort) {
    const row = reachedByExtension.get(installation.extension) ?? {
      extension: installation.extension,
      name: installation.extensionName,
      installations: 0,
      firstSuccess: 0,
      capReached: 0,
      proClicked: 0,
      fulfillments: fulfillments.byExtension.get(installation.extension) ?? 0,
    };
    const counts = (name: FunnelStep): boolean =>
      view === "cohort"
        ? installation.milestones[name] !== undefined
        : inRange(installation.milestones[name], filters);
    if (counts("installed")) row.installations++;
    if (counts("first_action_succeeded")) row.firstSuccess++;
    if (counts("free_cap_reached")) row.capReached++;
    if (counts("get_pro_clicked")) row.proClicked++;
    reachedByExtension.set(installation.extension, row);
  }

  const now = Date.now();
  const installTimes = cohort.flatMap((installation) => {
    const at = installation.milestones.installed;
    return at === undefined ? [] : [{ at }];
  });
  const rangeEnd = filters.to ?? now;

  return {
    storeConfigured,
    fetchedAt: now,
    retentionDays: funnelRetentionDays(),
    view,
    cohortIncomplete: view === "cohort" && rangeEnd >= now - COHORT_SETTLING_MS,
    truncated,
    installations,
    withoutInstallEvent,
    steps,
    // Exactly the README definition: the six step totals summed, divided by
    // the installations that reached step 1.
    averageStepsCompleted: share(
      [...stepUsers, fulfillments.total].reduce((sum, users) => sum + users, 0),
      installations,
    ),
    reviewClicks: {
      users: reached("review_link_clicked"),
      eligible: stepUsers[2],
    },
    purchases: { fulfillments: fulfillments.total, attributed: false },
    versions: [...new Set(matching.flatMap((installation) => installation.versions))].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    ),
    locales: [...new Set(matching.flatMap((installation) => installation.locales))].sort(),
    byExtension: [...reachedByExtension.values()].sort(
      (a, b) => b.installations - a.installations || a.name.localeCompare(b.name),
    ),
    daily: dashboardDailySeries(installTimes, (item) => item.at, () => 1, filters, now, funnelRetentionDays()),
  };
}
