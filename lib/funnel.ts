import { EXTENSIONS, getExtension } from "./extensions";
import { getProduct } from "./products";
import { dashboardDailySeries, type DashboardFilters } from "./dashboard-filters";
import { kvGetMany, kvScan, kvSet, storeConfigured } from "./store";
import { cachedRead } from "./snapshot-cache";

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

/**
 * Optional steps between `installed` and `first_action_started`, for extensions
 * that need to see where a first session stalls. Only some extensions send
 * them, so they are reported beside the funnel as shares of installs rather
 * than as ordered steps — a product that never emits them must not show a
 * 0% step in its own funnel.
 */
export const ACTIVATION_STEPS = [
  "workspace_opened",
  "login_required",
  "items_loaded",
  "item_selected",
  "confirm_opened",
  "action_failed",
] as const;

export type ActivationStep = (typeof ACTIVATION_STEPS)[number];

/** The series drawn on the activity chart, in their fixed colour order. */
export const CHART_EVENT_NAMES = [...FUNNEL_STEPS, "review_link_clicked"] as const;

export const FUNNEL_EVENT_NAMES = [...CHART_EVENT_NAMES, ...ACTIVATION_STEPS] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

export const FUNNEL_EVENT_LABELS: Record<FunnelEventName, string> = {
  installed: "Installed",
  first_action_started: "First action started",
  first_action_succeeded: "First action succeeded",
  free_cap_reached: "Free cap reached",
  get_pro_clicked: "Get Pro clicked",
  review_link_clicked: "Review link clicked",
  workspace_opened: "Opened the tool",
  login_required: "Had to sign in first",
  items_loaded: "Saw their items",
  item_selected: "Selected an item",
  confirm_opened: "Opened the confirmation",
  action_failed: "Had an action fail",
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
  /**
   * Share of the previous step that reached this one. Null on an unattributed
   * step: a website purchase total divided by a telemetry cohort is not a
   * conversion rate, and printing one invites reading it as though it were.
   */
  conversionFromPrevious: number | null;
  conversionFromInstall: number | null;
  dropOff: number | null;
  /** True for the step that is not joined to an installation. */
  unattributed: boolean;
}

/**
 * The three numbers the suite is steered by. Each is a ratio of two counts that
 * are reported beside it, and is null when its denominator is zero — "0%" and
 * "nothing to measure" are different answers.
 */
export interface FunnelKpis {
  installations: number;
  firstSuccess: number;
  /** KPI 1: installs that reached `first_action_succeeded`. */
  activation: number | null;
  /** Installations counted in `firstSuccess` that also clicked Get Pro. */
  proAfterSuccess: number;
  /** KPI 2: activated installs that clicked Get Pro. */
  upgradeIntent: number | null;
  /** Get Pro clicks that happened inside the period, whenever the install arrived. */
  proClicksInPeriod: number;
  /** First payments inside the same period, from the product's first tracked click on. */
  purchasesInPeriod: number;
  revenueCents: number;
  /** KPI 3, in cents: `revenueCents` per `proClicksInPeriod`. */
  revenuePerProClick: number | null;
}

export interface FunnelVersionRow {
  /** The version the installation first reported, not the one it runs today. */
  version: string;
  installations: number;
  firstSuccess: number;
  activation: number | null;
  proAfterSuccess: number;
  upgradeIntent: number | null;
}

export interface FunnelActivationRow {
  name: ActivationStep;
  label: string;
  users: number;
  conversionFromInstall: number;
}

export interface FunnelDailySeries {
  name: FunnelEventName;
  label: string;
  /** Slot in the fixed categorical order — colour follows the event, never its rank. */
  slot: number;
  total: number;
  points: Array<{ day: string; count: number }>;
}

export interface FunnelCatalogEntry {
  extension: string;
  name: string;
  icon: string;
  /** Every retained tracked installation, not only those inside the date range. */
  installations: number;
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
  /** How many steps that average is out of — see the comment where it is computed. */
  averageStepsBasis: number;
  reviewClicks: { users: number; eligible: number };
  /** Empty when no installation in view reported an activation step. */
  activation: FunnelActivationRow[];
  purchases: { fulfillments: number; attributed: false };
  /** The three KPIs for everything in view. */
  kpis: FunnelKpis;
  /**
   * False under a version or locale filter: a purchase carries neither, so
   * revenue cannot be narrowed to match the clicks and KPI 3 is withheld.
   */
  revenueComparable: boolean;
  versions: string[];
  locales: string[];
  byExtension: Array<FunnelKpis & {
    extension: string;
    name: string;
    capReached: number;
    proClicked: number;
    fulfillments: number;
  }>;
  /** KPI 1 and 2 by install version. Empty unless one extension is selected. */
  byVersion: FunnelVersionRow[];
  daily: Array<{ day: string; count: number }>;
  /** Every product, for the picker — including those with no telemetry yet. */
  catalog: FunnelCatalogEntry[];
  /**
   * One line per milestone, counted on the day it happened. This is activity,
   * not the cohort above: a Get Pro click today belongs to today's line even
   * when that installation arrived months ago. Mixing the two would make a
   * chart that disagrees with itself.
   */
  dailyByEvent: FunnelDailySeries[];
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
  const [row] = await kvGetMany([key]);
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

interface FunnelPurchase {
  at: number;
  slugs: string[];
  /** List price of the product bought, in cents. */
  amountCents: number;
}

/**
 * Verified website fulfillments, one per purchase.
 *
 * A subscription is written twice — under its checkout id and again under its
 * subscription id, which every renewal then rewrites — so it is counted once,
 * at its earliest record. That makes revenue the first payment only: renewals,
 * tax, refunds and currency conversion are not in these records.
 */
async function readPurchases(): Promise<FunnelPurchase[]> {
  // Read-then-filter: the period and product filters are applied by the
  // callers, so the bytes are identical whatever the dashboard is showing.
  const rows = await cachedRead(`funnel:purchases`, async () =>
    kvGetMany(await kvScan(`${PURCHASE_PREFIX}*`)),
  );
  const purchases = new Map<string, FunnelPurchase>();

  for (const { key, value } of rows) {
    if (!value) continue;
    try {
      const parsed = JSON.parse(value) as {
        extensionSlugs?: unknown;
        updatedAt?: unknown;
        productId?: unknown;
        subscriptionId?: unknown;
      };
      const at = Number(parsed.updatedAt);
      if (!Number.isFinite(at)) continue;
      const slugs = Array.isArray(parsed.extensionSlugs)
        ? parsed.extensionSlugs.filter((slug): slug is string => typeof slug === "string")
        : [];
      const id = typeof parsed.subscriptionId === "string" && parsed.subscriptionId
        ? `subscription:${parsed.subscriptionId}`
        : key;
      const existing = purchases.get(id);
      if (existing && existing.at <= at) continue;
      purchases.set(id, {
        at,
        slugs,
        amountCents: typeof parsed.productId === "string" ? getProduct(parsed.productId)?.amount ?? 0 : 0,
      });
    } catch {
      // A malformed audit record must not hide the funnel.
    }
  }

  return [...purchases.values()];
}

/**
 * Step 6 is deliberately NOT joined to an installation: no attribution token
 * exists yet, and inferring one from a license key would turn licensing data
 * into analytics. It is counted inside the selected period and labelled as a
 * website total.
 */
function countFulfillments(
  purchases: FunnelPurchase[],
  filters: FunnelFilters,
): { total: number; byExtension: Map<string, number> } {
  const byExtension = new Map<string, number>();
  let total = 0;

  for (const purchase of purchases) {
    if (!inRange(purchase.at, filters)) continue;
    if (filters.extension && !purchase.slugs.includes(filters.extension)) continue;
    total++;
    for (const slug of purchase.slugs) byExtension.set(slug, (byExtension.get(slug) ?? 0) + 1);
  }

  return { total, byExtension };
}

/**
 * Revenue for one product between `from` and `to`. A retired bundle unlocked
 * several products for one price; its amount is split evenly so the rows still
 * add up to what was charged.
 */
function revenueFor(
  purchases: FunnelPurchase[],
  extension: string,
  from: number,
  to: number,
): { purchases: number; revenueCents: number } {
  let count = 0;
  let revenueCents = 0;
  for (const purchase of purchases) {
    if (purchase.at < from || purchase.at > to || !purchase.slugs.includes(extension)) continue;
    count++;
    revenueCents += purchase.amountCents / purchase.slugs.length;
  }
  return { purchases: count, revenueCents };
}

function ratio(value: number, total: number): number | null {
  return total > 0 ? value / total : null;
}

function share(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

export async function listFunnel(filters: FunnelFilters = {}): Promise<FunnelSnapshot> {
  const view: FunnelView = filters.view === "activity" ? "activity" : "cohort";
  // Scan every product once: the key itself names the extension, so the picker's
  // per-product counts cost no extra reads, and only the selected product's
  // documents are actually fetched.
  const allKeys = await cachedRead(`funnel:keys`, async () =>
    (await kvScan(`${INSTALL_PREFIX}*`)).sort(),
  );
  const catalogCounts = new Map<string, number>();
  for (const key of allKeys) {
    const slug = key.slice(INSTALL_PREFIX.length).split(":", 1)[0];
    if (slug) catalogCounts.set(slug, (catalogCounts.get(slug) ?? 0) + 1);
  }
  const keys = filters.extension
    ? allKeys.filter((key) => key.startsWith(`${INSTALL_PREFIX}${filters.extension}:`))
    : allKeys;
  const truncated = keys.length > MAX_DASHBOARD_INSTALLATIONS;
  // Cached per selected product, which is the only filter that changes which
  // documents are read. Date, version and locale are applied in memory below,
  // so moving those controls now costs nothing.
  const rows = await cachedRead(`funnel:rows:${filters.extension || "all"}`, () =>
    kvGetMany(keys.slice(0, MAX_DASHBOARD_INSTALLATIONS)),
  );
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
  const purchases = await readPurchases();
  const fulfillments = countFulfillments(purchases, filters);

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
    conversionFromPrevious: null,
    conversionFromInstall: null,
    dropOff: null,
    unattributed: true,
  });

  const counts = (installation: FunnelInstallation, name: FunnelEventName): boolean =>
    view === "cohort"
      ? installation.milestones[name] !== undefined
      : inRange(installation.milestones[name], filters);

  const reachedByExtension = new Map<string, FunnelSnapshot["byExtension"][number]>();
  const extensionRow = (installation: FunnelInstallation) => {
    let row = reachedByExtension.get(installation.extension);
    if (!row) {
      row = {
        extension: installation.extension,
        name: installation.extensionName,
        installations: 0,
        firstSuccess: 0,
        activation: null,
        proAfterSuccess: 0,
        upgradeIntent: null,
        proClicksInPeriod: 0,
        purchasesInPeriod: 0,
        revenueCents: 0,
        revenuePerProClick: null,
        capReached: 0,
        proClicked: 0,
        fulfillments: fulfillments.byExtension.get(installation.extension) ?? 0,
      };
      reachedByExtension.set(installation.extension, row);
    }
    return row;
  };
  const versionRows = new Map<string, FunnelVersionRow>();

  for (const installation of cohort) {
    const row = extensionRow(installation);
    const succeeded = counts(installation, "first_action_succeeded");
    const clicked = counts(installation, "get_pro_clicked");
    if (counts(installation, "installed")) row.installations++;
    if (succeeded) row.firstSuccess++;
    if (succeeded && clicked) row.proAfterSuccess++;
    if (counts(installation, "free_cap_reached")) row.capReached++;
    if (clicked) row.proClicked++;

    if (!filters.extension) continue;
    const version = installation.versions[0] || "unknown";
    const versionRow = versionRows.get(version) ?? {
      version, installations: 0, firstSuccess: 0, activation: null, proAfterSuccess: 0, upgradeIntent: null,
    };
    if (counts(installation, "installed")) versionRow.installations++;
    if (succeeded) versionRow.firstSuccess++;
    if (succeeded && clicked) versionRow.proAfterSuccess++;
    versionRows.set(version, versionRow);
  }

  // KPI 3 is always activity in the period, whatever the view: a purchase is
  // not joined to an installation, so the only honest pairing is clicks and
  // revenue from the same days. Revenue starts at the product's first tracked
  // click — sales from before an extension shipped telemetry have no clicks to
  // be divided by and would otherwise inflate the figure.
  const revenueComparable = !filters.version && !filters.locale;
  const firstClickAt = new Map<string, number>();
  for (const installation of retained) {
    const at = installation.milestones.get_pro_clicked;
    if (at === undefined) continue;
    firstClickAt.set(installation.extension, Math.min(firstClickAt.get(installation.extension) ?? at, at));
  }
  for (const installation of matching) {
    if (inRange(installation.milestones.get_pro_clicked, filters)) extensionRow(installation).proClicksInPeriod++;
  }

  const kpis: FunnelKpis = {
    installations: 0,
    firstSuccess: 0,
    activation: null,
    proAfterSuccess: 0,
    upgradeIntent: null,
    proClicksInPeriod: 0,
    purchasesInPeriod: 0,
    revenueCents: 0,
    revenuePerProClick: null,
  };
  for (const row of reachedByExtension.values()) {
    const trackedFrom = firstClickAt.get(row.extension);
    if (revenueComparable && trackedFrom !== undefined) {
      const revenue = revenueFor(
        purchases,
        row.extension,
        Math.max(filters.from ?? trackedFrom, trackedFrom),
        filters.to ?? Number.POSITIVE_INFINITY,
      );
      row.purchasesInPeriod = revenue.purchases;
      row.revenueCents = Math.round(revenue.revenueCents);
      row.revenuePerProClick = ratio(row.revenueCents, row.proClicksInPeriod);
    }
    row.activation = ratio(row.firstSuccess, row.installations);
    row.upgradeIntent = ratio(row.proAfterSuccess, row.firstSuccess);

    kpis.installations += row.installations;
    kpis.firstSuccess += row.firstSuccess;
    kpis.proAfterSuccess += row.proAfterSuccess;
    kpis.proClicksInPeriod += row.proClicksInPeriod;
    kpis.purchasesInPeriod += row.purchasesInPeriod;
    kpis.revenueCents += row.revenueCents;
  }
  kpis.activation = ratio(kpis.firstSuccess, kpis.installations);
  kpis.upgradeIntent = ratio(kpis.proAfterSuccess, kpis.firstSuccess);
  if (revenueComparable) kpis.revenuePerProClick = ratio(kpis.revenueCents, kpis.proClicksInPeriod);

  const byVersion = [...versionRows.values()]
    .map((row) => ({
      ...row,
      activation: ratio(row.firstSuccess, row.installations),
      upgradeIntent: ratio(row.proAfterSuccess, row.firstSuccess),
    }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  const activationUsers = ACTIVATION_STEPS.map((name) => reached(name));
  const activationRows: FunnelActivationRow[] = activationUsers.some((users) => users > 0)
    ? ACTIVATION_STEPS.map((name, index) => ({
        name,
        label: FUNNEL_EVENT_LABELS[name],
        users: activationUsers[index],
        conversionFromInstall: share(activationUsers[index], installations),
      }))
    : [];

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
    // The README defines this over six steps, which assumes step 6 is
    // attributed. It is not yet, and a website purchase total is unbounded by
    // the tracked cohort — live data showed 196 fulfillments against a single
    // telemetry installation, which would report "199 of 6 steps". So the
    // average covers the five milestones that really are per-installation, and
    // `averageStepsBasis` says so. Fold purchases back in when an attribution
    // token exists.
    averageStepsCompleted: share(
      stepUsers.reduce((sum, users) => sum + users, 0),
      installations,
    ),
    averageStepsBasis: FUNNEL_STEPS.length,
    reviewClicks: {
      users: reached("review_link_clicked"),
      eligible: stepUsers[2],
    },
    activation: activationRows,
    purchases: { fulfillments: fulfillments.total, attributed: false },
    kpis,
    revenueComparable,
    byVersion,
    versions: [...new Set(matching.flatMap((installation) => installation.versions))].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    ),
    locales: [...new Set(matching.flatMap((installation) => installation.locales))].sort(),
    byExtension: [...reachedByExtension.values()].sort(
      (a, b) => b.installations - a.installations || a.name.localeCompare(b.name),
    ),
    daily: dashboardDailySeries(installTimes, (item) => item.at, () => 1, filters, now, funnelRetentionDays()),
    catalog: EXTENSIONS.map((extension) => ({
      extension: extension.slug,
      name: extension.shortName,
      icon: extension.icon,
      installations: catalogCounts.get(extension.slug) ?? 0,
    })).sort((a, b) => b.installations - a.installations || a.name.localeCompare(b.name)),
    dailyByEvent: CHART_EVENT_NAMES.map((name, slot) => {
      const occurrences = matching.flatMap((installation) => {
        const at = installation.milestones[name];
        return at === undefined ? [] : [{ at }];
      });
      const points = dashboardDailySeries(
        occurrences, (item) => item.at, () => 1, filters, now, funnelRetentionDays(),
      );
      return {
        name,
        label: FUNNEL_EVENT_LABELS[name],
        slot,
        total: points.reduce((sum, point) => sum + point.count, 0),
        points,
      };
    }),
  };
}
