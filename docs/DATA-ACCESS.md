# Accessing telemetry & crash data

How to read the funnel and crash data the extensions send, for analysis.

## Where the data comes from

```
extension                                website (this repo)                 storage
─────────                                ───────────────────                 ───────
src/lib/telemetry.js  ── POST batch ──▶  app/api/telemetry/route.ts  ──┬──▶  funnel:install:*   (lib/funnel.ts)
src/lib/crash-reporter.js (queued)       lib/telemetry.ts (fan-out)    └──▶  crash:event:*      (lib/crashes.ts)
manual "report a problem" ─ POST ──────▶ app/api/crash/route.ts ───────────▶ crash:event:*
uninstall page (pre-baked URL) ────────▶ app/api/telemetry/route.ts (source: "uninstall-fallback")
```

- **Extension side** (e.g. `mass-friends-remover-facebook/`):
  - `src/lib/telemetry.js` queues funnel events and errors, uploads them in batches (≤50 items, ≤60 KB) and bakes the last few into the uninstall URL as a fallback.
  - `src/lib/crash-reporter.js` builds error items: fingerprint, top frame, `context`, last 10 `breadcrumbs`, and client-side dedupe via `occurrences`.
  - Funnel events are fired from `src/background/service-worker.js` (`recordFunnelEvent(...)`).
- **Server side**: `lib/telemetry.ts` rejects unknown events and ignores retried items (`telemetry:item:*`, 14 days). It then writes funnel milestones through `lib/funnel.ts` and errors through `lib/crashes.ts`.
- **Storage**: production **Upstash Redis** (Vercel KV). The client is `lib/store.ts`.

The raw installation UUID is never stored. It is HMAC-hashed with `CRASH_INSTALLATION_SALT` into `installationHash`, and funnel and crash records share that hash, so you can join them on it.

## Credentials

Everything is in the single gitignored file `cleanmysocial/.env`. Production values are also in Vercel → Project → Settings → Environment Variables.

| Variable | Use it for |
| --- | --- |
| `KV_REST_API_READ_ONLY_TOKEN` | **Analysis.** Can only read, so it can't damage data. |
| `KV_REST_API_URL` | Upstash REST endpoint (used with either token). |
| `KV_REST_API_TOKEN` | Read/write. Used by the app itself; avoid it for analysis. |
| `ADMIN_TOKEN` | The `/crash` dashboard and `/api/admin/*` endpoints. |

## Option 1: Dashboard (no setup)

Open `https://cleanmysocial.com/crash` and enter `ADMIN_TOKEN`. It has Crashes, Funnel, Feedback and Email log tabs, with filters for extension and date range.

## Option 2: Admin API (aggregated JSON)

The dashboard is built on these endpoints. Pass the token as the `x-admin-token` header (or `Authorization: Bearer …`).

```bash
source .env
curl -s -H "x-admin-token: $ADMIN_TOKEN" \
  "https://cleanmysocial.com/api/admin/funnel?extension=mass-unfriender" | jq .
```

| Endpoint | Returns | Query params |
| --- | --- | --- |
| `/api/admin/funnel` | `FunnelSnapshot` (`lib/funnel.ts`): step counts, conversion, drop-off, daily series, per-extension rows | `extension`, `from`, `to` (epoch ms), `version`, `locale`, `view=cohort\|activity` |
| `/api/admin/crashes` | Issues grouped by fingerprint (`lib/crashes.ts`): counts, affected installs, versions, recent events | `extension`, `from`, `to` |
| `/api/admin/feedback` | Uninstall survey answers (`lib/uninstall-feedback.ts`) | `extension`, `from`, `to` |
| `/api/admin/emails` | Outbound email audit log (`lib/email-log.ts`) | |

**Cohort vs activity:**
- `cohort` (the default) follows installations that installed within the range.
- `activity` counts milestones that happened within the range.

## Option 3: Raw records from Redis (best for deep analysis)

### Export script

```bash
npm run export:telemetry                                    # all extensions
npm run export:telemetry -- --extension mass-unfriender     # one extension
npm run export:telemetry -- --out ~/Desktop/cms-data        # custom folder
```

This writes `installations.json` and `crashes.json` to `telemetry-export/` (gitignored). It uses only the read-only token and only `SCAN`/`GET`. Source: `scripts/export-telemetry.mjs`.

### Direct REST calls

Upstash REST takes a Redis command as a JSON array:

```bash
source .env
kv() { curl -s -X POST "$KV_REST_API_URL" \
  -H "authorization: Bearer $KV_REST_API_READ_ONLY_TOKEN" \
  -H "content-type: application/json" -d "$1"; }

kv '["DBSIZE"]'
kv '["SCAN","0","MATCH","funnel:install:mass-unfriender:*","COUNT","1000"]'   # repeat with the returned cursor until "0"
kv '["GET","crash:event:1789364467199:82ff65e7-5302-4928-86f9-7e11a3ff4602"]'
```

To read many keys in one round trip, POST `[["GET","k1"],["GET","k2"],…]` to `$KV_REST_API_URL/pipeline`.

## Key schema

| Key pattern | Contents | Retention |
| --- | --- | --- |
| `funnel:install:<extension>:<installationHash>` | One document per installation: first time each milestone happened | `FUNNEL_RETENTION_DAYS` (90) |
| `crash:event:<receivedAt ms>:<uuid>` | One crash/error report | `CRASH_RETENTION_DAYS` (90) |
| `crash:issue-status:*` | Resolved/ignored state set on the dashboard | — |
| `telemetry:item:*` | Record of batch items already stored, so retries aren't counted twice | 14 days |
| `purchase:creem:*` | Fulfilled purchases (funnel step 6, not tied to an installation) | — |
| `uninstall-feedback:*` | Uninstall survey answers | — |
| `email-log:*` | Outbound email audit | `EMAIL_LOG_RETENTION_DAYS` (90) |

Extension slugs seen in the data: `mass-unfriender`, `instagram-dm-cleaner`, `cleanerx`, `facebook-activity-cleaner`, `facebook-instagram-cleaner`, `facebook-messenger-cleaner`, `instagram-followers-tracker`, `reddit-cleaner`, `cleanfeed`, `gmail-cleaner`.

### Funnel installation document

```json
{
  "extension": "mass-unfriender",
  "extensionName": "Mass Friends Remover",
  "installationHash": "0179e8efaddb7ba8eb2a4d1e",
  "milestones": { "installed": 1789409469522, "first_action_started": 1789409500000 },
  "versions": ["61.2"],
  "locales": ["ar"],
  "firstSeen": 1789409469522,
  "updatedAt": 1789409818914
}
```

**Milestones, in funnel order:**
1. `installed`
2. `first_action_started`
3. `first_action_succeeded`
4. `free_cap_reached`
5. `get_pro_clicked`
6. `purchase_completed` (server-only, from `purchase:creem:*`)

`review_link_clicked` is also tracked, but it isn't a funnel step. Extensions that report the optional activation steps (`workspace_opened`, `login_required`, `items_loaded`, `item_selected`, `confirm_opened`) store them in the same `milestones` object; the dashboard shows them in the Activation panel and in `activation` from `/api/admin/funnel`. Mass Friends Remover sends them from v62.1. Each timestamp records the **first** time the milestone happened; later deliveries never move it. A document without `installed` belongs to an existing user who updated to a version with telemetry.

### Crash event

```json
{
  "id": "82ff65e7-5302-4928-86f9-7e11a3ff4602",
  "fingerprint": "871a905e49f9fc79",
  "extension": "mass-unfriender",
  "extensionId": "fegkbiinmaoipoonnlhekdoefgebmdnj",
  "installationHash": "f6740ebd12a8bc945c2bc23c",
  "version": "61.2",
  "source": "background:friends-roster",
  "name": "Error",
  "code": "friends_roster_failed",
  "message": "roster_payload_missing_v2",
  "stack": "Error: roster_payload_missing_v2\n    at …",
  "file": "assets/service-worker.js", "line": 5, "column": 8634,
  "context": { "attempt": 1, "phase": "read-roster", "responseKeys": "none" },
  "breadcrumbs": [
    { "code": "roster_load_started", "agoMs": 3065 },
    { "code": "roster_load_failed", "agoMs": 4 }
  ],
  "locale": "en-US", "platform": "Windows", "browser": "Chrome 153",
  "occurredAt": 1789364417568,
  "receivedAt": 1789364467199,
  "occurrences": 1
}
```

- **`fingerprint`** groups equivalent errors into one issue. Group by `code` + `message` + `source` when you want a readable breakdown.
- **`occurrences`** counts this report plus identical ones the client suppressed. Sum it for volume; count distinct `installationHash` values for reach.
- **`source`**:
  - `background:*`: automatic reports.
  - `manual-breakage-report`: the user pressed "report a problem". These usually have no `installationHash`.
  - `uninstall-fallback`: delivered through the uninstall URL. These have only `code`, with no message or stack.
- **`context`** holds allow-listed diagnostics, such as `phase`, `operation`, `httpStatus` and `apiErrorCode`.
- **`breadcrumbs`** lists the last 10 workflow steps before the error, in order.

## Analysis recipes (Node, on an export)

```js
const installs = require("./telemetry-export/installations.json");
const crashes = require("./telemetry-export/crashes.json");

// Funnel
const steps = ["installed", "first_action_started", "first_action_succeeded", "free_cap_reached", "get_pro_clicked"];
for (const s of steps) console.log(s, installs.filter((i) => i.milestones[s]).length);

// Top issues by affected installations
const issues = {};
for (const c of crashes) {
  const k = `${c.code} | ${c.message} | ${c.source}`;
  issues[k] ??= { occ: 0, installs: new Set() };
  issues[k].occ += c.occurrences || 1;
  issues[k].installs.add(c.installationHash);
}
console.table(Object.entries(issues)
  .map(([k, v]) => ({ issue: k, installs: v.installs.size, occurrences: v.occ }))
  .sort((a, b) => b.installs - a.installs).slice(0, 20));

// Did crashing users still succeed? (join on installationHash)
const crashed = new Set(crashes.map((c) => c.installationHash));
const joined = installs.filter((i) => crashed.has(i.installationHash));
console.log(joined.length, "crashed;", joined.filter((i) => i.milestones.first_action_succeeded).length, "still succeeded");
```

## Safety

- Always use the read-only token for analysis. Never run write commands (`SET`, `DEL`, `FLUSH*`) against production.
- Exports contain stacks and per-installation hashes. Keep them local and don't commit them (`telemetry-export/` is gitignored).
- `npm run dev` uses the production Redis from `.env`. Use `npm run dev:sandbox` to work on dashboards without touching real data.
