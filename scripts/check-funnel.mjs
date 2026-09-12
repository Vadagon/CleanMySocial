import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

/**
 * Exercises the telemetry batch endpoint's library layer against the in-memory
 * store: ingestion, idempotent retries, the error fan-out into the crash
 * store, the pre-baked uninstall fallback shape, and the funnel arithmetic
 * documented in cleanmysocial/README.md.
 *
 * Run with: npm run check:funnel
 */

const require = createRequire(import.meta.url);
const cache = new Map();

function load(file) {
  const resolved = file.endsWith(".ts") || file.endsWith(".json") ? file : `${file}.ts`;
  if (resolved.endsWith(".json")) return JSON.parse(fs.readFileSync(resolved, "utf8"));
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} };
  cache.set(resolved, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const dir = path.dirname(resolved);
  const localRequire = (name) => {
    if (name.startsWith("@/")) return load(path.resolve(`${name.slice(2)}.ts`));
    if (name.startsWith(".")) return load(path.resolve(dir, name));
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports;
}

const telemetry = load(path.resolve("lib/telemetry.ts"));
const funnel = load(path.resolve("lib/funnel.ts"));
const crashes = load(path.resolve("lib/crashes.ts"));
const store = load(path.resolve("lib/store.ts"));

const EXTENSION = "mass-unfriender";
const now = Date.now();
let idCounter = 0;
const nextId = () => `itm${String(++idCounter).padStart(7, "0")}`;

function uuid(seed) {
  const hex = seed.toString(16).padStart(12, "0");
  return `a6f78276-cb48-4ebf-810f-${hex}`;
}

async function ingest(body) {
  const batch = telemetry.prepareTelemetryBatch(body);
  assert.ok(!("error" in batch), `batch rejected: ${batch.error}`);
  return telemetry.ingestTelemetryBatch(batch);
}

function envelope(installationId, items) {
  return {
    installationId,
    extension: EXTENSION,
    version: "1.4.0",
    locale: "en-US",
    platform: "macOS",
    browser: "Chrome 140",
    items,
  };
}

// 1. A mixed batch stores funnel milestones and fans errors into the crash store.
const first = uuid(1);
const mixed = envelope(first, [
  { id: nextId(), kind: "event", name: "installed", at: now - 3 * 86_400_000 },
  { id: nextId(), kind: "event", name: "first_action_started", at: now - 3 * 86_400_000 + 1_000 },
  { id: nextId(), kind: "event", name: "first_action_succeeded", at: now - 3 * 86_400_000 + 2_000 },
  {
    id: nextId(),
    kind: "error",
    name: "TypeError",
    code: "messenger_batch_failed",
    message: "Cannot read properties of null",
    source: "background:unfriend-batch",
    at: now - 60_000,
    suppressedCount: 4,
  },
]);
const firstResult = await ingest(mixed);
assert.equal(firstResult.storedEvents, 3);
assert.equal(firstResult.storedErrors, 1);
assert.equal(firstResult.duplicates, 0);
assert.deepEqual(
  [...firstResult.acceptedIds].sort(),
  mixed.items.map((item) => item.id).sort(),
  "every item in a valid batch must be acknowledged",
);

const afterFirst = await crashes.listCrashes();
assert.equal(afterFirst.totalEvents, 1);
assert.equal(afterFirst.totalOccurrences, 5, "one report plus four client-suppressed repeats");

// 2. The identical batch replayed changes nothing and is still acknowledged.
const replay = await ingest(mixed);
assert.equal(replay.storedEvents, 0);
assert.equal(replay.storedErrors, 0);
assert.equal(replay.duplicates, 4);
assert.deepEqual([...replay.acceptedIds].sort(), mixed.items.map((item) => item.id).sort());
const afterReplay = await crashes.listCrashes();
assert.equal(afterReplay.totalEvents, 1, "a retried batch must not duplicate crash rows");
assert.equal(afterReplay.totalOccurrences, 5, "a retried batch must not inflate occurrences");

// 3. A milestone re-delivered with a later timestamp keeps its first occurrence.
const later = await ingest(envelope(first, [
  { id: nextId(), kind: "event", name: "installed", at: now },
]));
assert.equal(later.storedEvents, 1);
const [installRow] = await store.kvGetManyWithTtl([`funnel:install:${EXTENSION}:${(await crashes.installationHash(first))}`]);
assert.ok(installRow.value, "the installation document is keyed by the shared crash hash");
assert.equal(
  JSON.parse(installRow.value).milestones.installed,
  now - 3 * 86_400_000,
  "a delayed upload must not move a milestone",
);

// 4. Contract violations are rejected — but acknowledged, so no queue wedges.
const reserved = telemetry.prepareTelemetryBatch(envelope(uuid(2), [
  { id: nextId(), kind: "event", name: "purchase_completed", at: now },
  { id: nextId(), kind: "event", name: "invented_event", at: now },
  { id: "not a valid id!", kind: "event", name: "installed", at: now },
]));
assert.equal(reserved.events.length, 0, "an extension may never emit purchase_completed");
assert.deepEqual(reserved.rejected.map((item) => item.error), [
  "purchase_completed_is_server_only",
  "unknown_event",
  "invalid_item_id",
]);
const reservedResult = await telemetry.ingestTelemetryBatch(reserved);
assert.equal(reservedResult.storedEvents, 0);
assert.equal(
  reservedResult.acceptedIds.length,
  3,
  "every rejected item is acknowledged so a poison item cannot wedge the client queue",
);

assert.equal(telemetry.prepareTelemetryBatch(envelope(uuid(3), [])).error, "items_required");
assert.equal(telemetry.prepareTelemetryBatch({ extension: "not-a-product", items: [] }).error, "unknown_extension");
assert.equal(
  telemetry.prepareTelemetryBatch({ ...envelope(uuid(3), []), installationId: "not-a-uuid" }).error,
  "invalid_installation_id",
);

// 5. The pre-baked uninstall fallback carries only { id, name, at }.
const fallback = await ingest({
  installationId: uuid(4),
  extension: EXTENSION,
  version: "1.4.0",
  source: "uninstall-fallback",
  items: [
    { id: nextId(), kind: "event", name: "installed", at: now - 86_400_000 },
    { id: nextId(), kind: "error", name: "unfriend_dialog_missing", code: "unfriend_dialog_missing", at: now - 30_000 },
  ],
});
assert.equal(fallback.storedEvents, 1);
assert.equal(fallback.storedErrors, 1, "a coded error with no message must still be stored");
const fallbackCrash = (await crashes.listCrashes()).issues.find(
  (issue) => issue.code === "unfriend_dialog_missing",
);
assert.ok(fallbackCrash, "the fallback error reaches the Crashes tab");
assert.equal(fallbackCrash.recent[0].source, "uninstall-fallback");

// 6. The README's worked example: 100, 99, 68, 62, 52, 2.
const DISTRIBUTION = [100, 99, 68, 62, 52];
const cohortStart = now - 20 * 86_400_000;
for (let index = 0; index < 100; index++) {
  const items = funnel.FUNNEL_STEPS
    .filter((_, step) => index < DISTRIBUTION[step])
    .map((name, step) => ({ id: nextId(), kind: "event", name, at: cohortStart + step * 1_000 }));
  await ingest({ ...envelope(uuid(100 + index), items), extension: "instagram-dm-cleaner" });
}
for (let index = 0; index < 2; index++) {
  await store.kvSet(
    `purchase:creem:example-${index}`,
    JSON.stringify({ extensionSlugs: ["instagram-dm-cleaner"], updatedAt: now - 86_400_000 }),
  );
}

const snapshot = await funnel.listFunnel({ extension: "instagram-dm-cleaner" });
assert.deepEqual(snapshot.steps.map((step) => step.users), [...DISTRIBUTION, 2]);
assert.equal(snapshot.installations, 100);
// The README's 3.83 sums all six steps, which assumes step 6 is attributed to
// installations. It is not, so the average covers the five tracked milestones:
// (100 + 99 + 68 + 62 + 52) / 100.
assert.equal(snapshot.averageStepsCompleted.toFixed(2), "3.81");
assert.equal(snapshot.averageStepsBasis, 5);
assert.equal(snapshot.steps[5].name, "purchase_completed");
assert.equal(snapshot.steps[5].unattributed, true, "step 6 is a website total, not an installation conversion");
assert.equal(snapshot.steps[5].conversionFromInstall, null, "an unattributed step reports no conversion rate");
assert.equal(snapshot.steps[5].dropOff, null);

// Live data has more lifetime purchases than tracked installations; that must
// not turn into a conversion rate or swamp the average.
for (let index = 0; index < 40; index++) {
  await store.kvSet(
    `purchase:creem:lopsided-${index}`,
    JSON.stringify({ extensionSlugs: ["instagram-dm-cleaner"], updatedAt: now - 86_400_000 }),
  );
}
const lopsided = await funnel.listFunnel({ extension: "instagram-dm-cleaner" });
assert.equal(lopsided.steps[5].users, 42);
assert.equal(lopsided.averageStepsCompleted.toFixed(2), "3.81", "purchases never enter the average");
assert.equal(Math.round(snapshot.steps[2].conversionFromPrevious * 100), 69);
assert.equal(Math.round(snapshot.steps[2].conversionFromInstall * 100), 68);
assert.equal(snapshot.steps[2].dropOff, 31);

// A cohort window that excludes the installs empties the funnel without error.
const empty = await funnel.listFunnel({
  extension: "instagram-dm-cleaner",
  from: now - 2 * 86_400_000,
  to: now,
});
assert.equal(empty.installations, 0);
assert.equal(empty.withoutInstallEvent, 0);
assert.equal(empty.averageStepsCompleted, 0);

// Activity view counts milestones inside the range instead of following a cohort.
const activity = await funnel.listFunnel({
  extension: "instagram-dm-cleaner",
  from: cohortStart - 1_000,
  to: cohortStart + 10_000,
  view: "activity",
});
assert.equal(activity.view, "activity");
assert.equal(activity.installations, 100);

// 7. The daily per-event series behind the activity chart.
const chart = await funnel.listFunnel({
  extension: "instagram-dm-cleaner",
  from: cohortStart - 2 * 86_400_000,
  to: now,
});
assert.equal(chart.dailyByEvent.length, 6, "one line per milestone, including review_link_clicked");
assert.deepEqual(
  chart.dailyByEvent.map((s) => s.name),
  [...funnel.FUNNEL_STEPS, "review_link_clicked"],
  "fixed categorical order — a colour slot must follow its event, not its rank",
);
assert.deepEqual(chart.dailyByEvent.map((s) => s.slot), [0, 1, 2, 3, 4, 5]);
for (const series of chart.dailyByEvent) {
  assert.equal(series.points.length, chart.daily.length, "every line shares the chart's day axis");
}
// Activity semantics: all 100 installs seeded their milestones on one day.
const installedLine = chart.dailyByEvent[0];
assert.equal(installedLine.total, 100);
assert.equal(Math.max(...installedLine.points.map((p) => p.count)), 100);
assert.equal(chart.dailyByEvent[2].total, 68, "first_action_succeeded matches the funnel step");

// A range that excludes the activity empties the lines without losing the axis.
const quiet = await funnel.listFunnel({ extension: "instagram-dm-cleaner", from: now - 86_400_000, to: now });
assert.ok(quiet.dailyByEvent.every((s) => s.total === 0));
assert.ok(quiet.dailyByEvent.every((s) => s.points.length > 0));

// The picker lists every product, with counts that ignore the date range so a
// quiet week cannot make a product look untracked.
assert.ok(chart.catalog.length >= 9, "every product is selectable");
const dmRow = chart.catalog.find((item) => item.extension === "instagram-dm-cleaner");
assert.equal(dmRow.installations, 100);
assert.equal(quiet.catalog.find((item) => item.extension === "instagram-dm-cleaner").installations, 100);
assert.ok(dmRow.icon.startsWith("/extensions/"), "the picker needs an icon path");
assert.ok(
  chart.catalog.some((item) => item.extension === "mass-unfriender"),
  "a product with no telemetry still appears in the picker",
);

console.log("funnel telemetry OK — ingestion, idempotent retries, crash fan-out, fallback replay, funnel math, daily series");
