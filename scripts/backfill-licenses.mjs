#!/usr/bin/env node
/**
 * One-off repair for licences the webhook never granted.
 *
 * Two problems, both fixed here:
 *
 *   1. Checkout attempts were still sitting as `pending:` records because the
 *      webhook's grant guard required an `access` value it could not derive,
 *      so grant() silently no-opped and never cleared them. A pending record
 *      alone does not prove payment; reconcile against Creem before applying.
 *   2. Three hand-made review licences live under `license:mass-unfriender:`
 *      and `license:messenger-cleaner:`, but /api/license only ever reads
 *      `license:cleanmysocial:<key>`, so nothing can find them.
 *
 * Dry run by default — prints exactly what it would write and touches nothing.
 * Pass --apply to commit. Re-running is safe: a key that already holds every
 * entitlement is skipped rather than rewritten.
 *
 *   node --env-file=.env.local scripts/backfill-licenses.mjs
 *   node --env-file=.env.local scripts/backfill-licenses.mjs --apply
 *
 * Does NOT email anyone. Delivering keys to confirmed customers is a separate,
 * deliberate step after payment reconciliation.
 */

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const APPLY = process.argv.includes("--apply");
const GROUP = "cleanmysocial";
const BUNDLE_ENTITLEMENTS = [
  "facebook-instagram-cleaner",
  "facebook-messenger-cleaner",
  "mass-unfriender",
];

if (!URL_ || !TOKEN) {
  console.error(
    "Missing Redis credentials. Set KV_REST_API_URL and KV_REST_API_TOKEN\n" +
      "(or the UPSTASH_REDIS_REST_* equivalents) in .env.local and run with\n" +
      "  node --env-file=.env.local scripts/backfill-licenses.mjs",
  );
  process.exit(1);
}

async function redis(command) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

async function scan(pattern) {
  const keys = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis(["SCAN", cursor, "MATCH", pattern, "COUNT", 250]);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

async function getJson(key) {
  const raw = await redis(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const normalize = (k) => String(k).trim().toLowerCase();
const licenceKeyFor = (key) => `license:${GROUP}:${normalize(key)}`;

/** Entitlements of an existing record; a missing field means the full bundle. */
function entitlementsOf(licence) {
  if (!licence) return [];
  if (!licence.entitlements) return [...BUNDLE_ENTITLEMENTS];
  return licence.entitlements;
}

function hasFullBundle(licence) {
  if (!licence) return false;
  const owned = new Set(entitlementsOf(licence));
  const live = licence.expiresAt === null || licence.expiresAt > Date.now();
  return live && BUNDLE_ENTITLEMENTS.every((s) => owned.has(s));
}

const planned = [];
const skipped = [];

/**
 * Test checkouts must never become real licences. `--include-probes` overrides,
 * for the case where a "probe" address turns out to be a genuine buyer.
 */
const INCLUDE_PROBES = process.argv.includes("--include-probes");
function isProbe(key, email) {
  if (INCLUDE_PROBES) return false;
  return /^probe-/i.test(String(key)) || /@example\.(com|org|net)$/i.test(String(email || ""));
}

async function planGrant(key, { plan, email, source, note }) {
  const storeKey = licenceKeyFor(key);

  if (isProbe(key, email)) {
    skipped.push({ storeKey, reason: "test/probe record — not a real purchase" });
    return;
  }
  // Two stranded records can name the same licence key; write it once.
  if (planned.some((p) => p.storeKey === storeKey)) {
    skipped.push({ storeKey, reason: "duplicate of an already-planned write" });
    return;
  }

  const existing = await getJson(storeKey);
  if (hasFullBundle(existing)) {
    skipped.push({ storeKey, reason: "already active with full bundle" });
    return;
  }
  const record = {
    key: normalize(key),
    extension: GROUP,
    plan,
    access: "lifetime",
    expiresAt: null,
    updatedAt: Date.now(),
    entitlements: [...BUNDLE_ENTITLEMENTS],
    products: existing?.products || [],
    ...(email ? { email } : {}),
    // Audit trail: these were not granted by a Creem webhook.
    backfilledAt: Date.now(),
    backfillSource: source,
    ...(existing?.creemId ? { creemId: existing.creemId } : {}),
  };
  planned.push({ storeKey, record, note });
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (nothing written)\n");

  // ---- 1. Paid-but-pending checkouts ----------------------------------
  const pendingKeys = await scan("pending:*");
  console.log(`Found ${pendingKeys.length} pending checkout(s).`);
  const pendings = [];
  for (const pk of pendingKeys) {
    const rec = await getJson(pk);
    if (!rec?.key) {
      skipped.push({ storeKey: pk, reason: "unreadable pending record" });
      continue;
    }
    pendings.push({ pendingKey: pk, rec });
    await planGrant(rec.key, {
      plan: rec.plan || "lifetime",
      email: rec.email,
      source: "pending-backfill",
      note: `from ${pk} (${rec.email || "no email"})`,
    });
  }

  // ---- 2. Review licences stranded under the wrong group ---------------
  const licenceKeys = await scan("license:*");
  const stranded = licenceKeys.filter((k) => !k.startsWith(`license:${GROUP}:`));
  console.log(`Found ${stranded.length} licence(s) stored outside the "${GROUP}" group.`);
  for (const lk of stranded) {
    const rec = await getJson(lk);
    if (!rec?.key) {
      skipped.push({ storeKey: lk, reason: "unreadable licence record" });
      continue;
    }
    await planGrant(rec.key, {
      plan: rec.plan || "review",
      email: rec.email,
      source: `regrouped-from:${lk}`,
      note: `was ${lk}`,
    });
  }

  // ---- Report ----------------------------------------------------------
  console.log(`\n=== ${planned.length} record(s) to write ===`);
  for (const p of planned) {
    console.log(`  ${p.storeKey}`);
    console.log(`      ${p.note}`);
    console.log(`      plan=${p.record.plan} entitlements=${p.record.entitlements.join(",")}`);
  }
  if (skipped.length) {
    console.log(`\n=== ${skipped.length} skipped ===`);
    for (const s of skipped) console.log(`  ${s.storeKey} — ${s.reason}`);
  }

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these records.");
    return;
  }

  // ---- Write -----------------------------------------------------------
  let written = 0;
  for (const p of planned) {
    await redis(["SET", p.storeKey, JSON.stringify(p.record)]);
    written++;
  }
  console.log(`\nWrote ${written} licence record(s).`);

  // Clear the pending records we just satisfied, so the vault stops showing
  // them as abandoned and the sweep never emails these people a nudge.
  let cleared = 0;
  for (const { pendingKey, rec } of pendings) {
    const licence = await getJson(licenceKeyFor(rec.key));
    if (hasFullBundle(licence)) {
      await redis(["DEL", pendingKey]);
      cleared++;
    }
  }
  console.log(`Cleared ${cleared} pending record(s).`);

  // The misplaced originals are left in place on purpose — they are the only
  // copy of the pre-Creem grant history, and nothing reads them any more.
  console.log("\nLeft the old mis-grouped licence keys untouched (harmless, unread).");
}

main().catch((e) => {
  console.error("\nFailed:", e.message);
  process.exit(1);
});
