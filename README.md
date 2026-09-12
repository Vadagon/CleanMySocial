# CleanMySocial

Marketing site, legal pages, Creem checkout, and shared-license API for
CleanMySocial products at `cleanmysocial.com`.

## The extensions

Nine extensions: eight paid, one free. Every paid tool is sold **on its own**
with a one-time 3-day pass, a monthly subscription, or lifetime access. There
are no bundles or combos. Monthly is the recommended/default offer.

| Extension | Slug | 3 days | Monthly | Lifetime | Store ID |
| --- | --- | ---: | ---: | ---: | --- |
| Delete All Messages for Facebook & Instagram | `facebook-instagram-cleaner` | $11.98 | $23.98 | $69.98 | `cboolboidgkagffpalhlojepcghkkfej` |
| Messenger Cleaner | `facebook-messenger-cleaner` | $7.98 | $13.98 | $39.98 | `imobgpikmofiapbnijmebknbkmkncdkl` |
| Mass Friends Remover for Facebook | `mass-unfriender` | $9.98 | $17.98 | $55.98 | `fegkbiinmaoipoonnlhekdoefgebmdnj` |
| DM Cleaner for Instagram | `instagram-dm-cleaner` | $9.98 | $15.98 | $49.98 | `aekeomcopkngciopbjbdmlmpgfdcndmm` |
| Followers Tracker for Instagram | `instagram-followers-tracker` | $9.98 | $17.98 | $59.98 | `kfaklckklmlknieiniakbekofgndfpbp` |
| Reddit Cleaner | `reddit-cleaner` | $9.98 | $19.98 | $59.98 | `ghddfkljkcojgpdngeaglannonehpldh` |
| CleanerX for X (Twitter) | `cleanerx` | $14.99 | $29.99 | $89.99 | `efkdbehpkfaiehogkiokbiecjdbiebgi` |
| Facebook Activity Log Cleaner | `facebook-activity-cleaner` | $9.98 | $19.98 | $59.98 | `iaimbgcccpmmdgpmkkcaiilgdeobgmcl` |
| **CleanFeed** — hides feeds, never charges | `cleanfeed` | — | — | free | `efebojaacbocpjiiimmjnjpnhlihmjee` |

Reddit Cleaner, CleanerX and the Activity Log Cleaner have prices on the site
but **no licence checks inside the extension yet** — they still run unrestricted
until gating ships in each codebase.

## Cross-promotion instead of bundles

Every product page ends with exactly two cards (`app/CrossPromo.tsx`,
`lib/upsell.ts`):

1. **one paid tool**, chosen as the natural next problem for that person, shown
   deliberately **without a price** — the click is about interest, not a second
   purchase decision;
2. **CleanFeed**, which is free and says so, on every page.

| Viewing | Paid card | Free card |
| --- | --- | --- |
| DM Cleaner | Followers Tracker | CleanFeed |
| Followers Tracker | DM Cleaner | CleanFeed |
| Messenger Cleaner | Mass Friends Remover | CleanFeed |
| Mass Friends Remover | Activity Log Cleaner | CleanFeed |
| Activity Log Cleaner | Mass Friends Remover | CleanFeed |
| Facebook & Instagram Cleaner | Followers Tracker | CleanFeed |
| Reddit Cleaner | CleanerX | CleanFeed |
| CleanerX | Reddit Cleaner | CleanFeed |
| CleanFeed | Facebook & Instagram Cleaner | — |

## Analytics

Google Analytics 4 (`G-51L37C7EGC`, the `cleanmysocial.com` stream)
loads from `app/GoogleAnalytics.tsx`, only in production builds. Override the
id with `NEXT_PUBLIC_GA_ID`, or set it to an empty string to disable.

## Private dashboards

This is the canonical home for website/admin dashboard behavior. Extension
documents define only what extensions record and send.

### Access and safety

The implemented private pages are:

- `/vault` — licenses, purchases, subscriptions, checkout, delivery, and Redis
  record inspection;
- `/crash` — Product health, with Crashes, Conversion funnel, Uninstall
  feedback, and Email log tabs.

Both use `ADMIN_TOKEN`. The browser sends it as `x-admin-token` to the private
admin APIs and remembers it locally under `cms-vault-token` until **Lock** is
clicked. The pages and API responses are dynamic, `no-store`, and excluded from
search indexing. Keep `ADMIN_TOKEN` private: Vault can expose license and master
access data, while Email log records can contain customer addresses, complete
messages, and delivered license keys.

The pages link to one another, support manual refresh and JSON export, and must
show a clear warning when Redis is not configured and data comes only from the
in-memory fallback.

### Vault — `/vault`

Vault reads `/api/admin/records`. It provides:

- record-type filters for `license`, `purchase`, `subscription`, `pending`,
  `undelivered`, `reminded`, `mailed`, `sweep`, and `other`;
- full-record search, an active-license-only filter, sorting, expandable raw
  details, TTL display, and filtered JSON export;
- per-entitlement access, product, subscription status, paid-through date,
  revocation state, and the customer-facing license status;
- paid-purchase counts grouped by stored product-page locale;
- exact-key lookup for support through `/api/admin/records?key=<KEY>`;
- server-configured master key and master-prefix display with copy actions.

Vault must use the same entitlement resolution as `/api/license`; a stored date
or legacy summary must never make an expired, refunded, or wrong-product key
look active.

### Product health — `/crash`

Product health reads:

- `/api/admin/crashes` for automatic errors and retained platform-breakage
  events;
- `/api/admin/funnel` for Conversion Funnel milestones;
- `/api/admin/feedback` for optional uninstall responses;
- `/api/admin/emails` for outbound email attempts;
- `/api/admin/crashes/status` to change an issue between **Open**,
  **Investigating**, **Fixed**, and **Ignored**.

All four tabs share extension and time filters: all retained data, last 24
hours, 7 days, 14 days, 30 days, or custom dates. Crashes additionally support
text, version, and issue-status filters.

The Crashes tab shows 24-hour and 7-day totals, actionable issues, affected
installations, total occurrences, daily activity, and totals by extension. Each
issue groups the server fingerprint across reports and exposes versions,
sources, first/last seen, occurrences, affected installations, actionable
file/line/column, safe context, breadcrumbs, and recent sanitized reports. The
view reads at most the newest 5,000 matching retained events and must warn when
the result is truncated.

The Uninstall feedback tab shows retained responses and written-comment totals
using the same extension/date filters. Skipping feedback stores nothing.

The Email log tab shows every attempted license and lifecycle email, including
sent, failed, rejected, and skipped results; subject, plain-text and HTML body;
SMTP message ID; recipient; and product/extension context. The default email-log
retention is 90 days and is configured with `EMAIL_LOG_RETENTION_DAYS`.

Crash retention defaults to 90 days and is configured with
`CRASH_RETENTION_DAYS`. A new fingerprint in an extension version, or a
fingerprint affecting the configured number of distinct installations inside
15 minutes, can email `REPORT_EMAIL`. `CRASH_ALERTS_ENABLED` disables those
alerts and `CRASH_SPIKE_INSTALLATIONS` changes the threshold from its default
of 3. Redis markers prevent repeated alerts.

### Conversion funnel — `/crash`

Extensions upload funnel milestones and automatic errors in one batch to
`POST /api/telemetry`, the shared transport defined in
[Conversion Funnel](../docs/CONVERSION-FUNNEL.md). The endpoint fans the batch
out: errors go through the same pipeline as `/api/crash` and appear on the
Crashes tab, milestones update one funnel document per installation. It
acknowledges every item it will not ask for again in `acceptedIds` — stored,
already stored, or malformed — so a rejected item can never wedge an
extension's queue, and replies `503` without acknowledging anything when
storage fails.

Ingestion is idempotent by installation plus item ID: a claim marker makes a
retried batch a no-op, and milestones keep their earliest timestamp, so a
delayed upload never moves an occurrence. Installation UUIDs are HMACed with
the same `CRASH_INSTALLATION_SALT` as crashes, so one installation hashes
identically in both stores. Funnel documents are retained for
`FUNNEL_RETENTION_DAYS` and, like crash events, are hidden from Vault.

The uninstalled page replays the pre-baked fallback automatically: it posts any
`iid`, `events`, and `error` parameters to the same endpoint, then strips them
from the URL. Because ingestion deduplicates, a normal POST racing with removal
cannot create duplicate rows.

The ordered paid-extension funnel is:

| Step | Milestone | Users |
| ---: | --- | ---: |
| 1 | Installed | Distinct telemetry installations with `installed` |
| 2 | First action started | Distinct installations with `first_action_started` |
| 3 | First action succeeded | Distinct installations with `first_action_succeeded` |
| 4 | Free cap reached | Distinct installations with `free_cap_reached` |
| 5 | Get Pro clicked | Distinct installations with `get_pro_clicked` |
| 6 | Purchase completed | Verified, attributed `purchase_completed` fulfillments |

Show distinct users at every step, conversion from the preceding step,
conversion from install, and drop-off. **Average steps completed** is:

```text
sum(distinct installations reaching each tracked step)
÷ distinct installations reaching installed
```

Step 6 is excluded while it is unattributed. A website purchase total is not
bounded by the tracked cohort — production has shown 196 fulfillments against a
single telemetry installation, which under a six-step sum would report "199 of
6 steps" — so the dashboard averages the five per-installation milestones and
labels the basis. For `100, 99, 68, 62, 52` that is `3.81` of 5 steps; fold
purchases back in, for `3.83` of 6, once an attribution token exists.

For the same reason step 6 shows its count with no conversion rate and no
drop-off: dividing fulfillments by a telemetry cohort would print a number that
reads like a conversion and is not one.

`review_link_clicked` is separate from the ordered funnel because it can happen
before or after purchase. Its rate uses `first_action_succeeded` installations
as the eligible denominator, and it means only that the store review page was
opened—not that a review was submitted.

The tab opens with **Events per day**: a product picker beside one line per
milestone, over the selected range. Those lines are *activity*, not the cohort
below them — a milestone is counted on the day it happened, so a Get Pro click
today belongs to today's line even when that installation arrived months ago.
Picking a product in the rail drives the same extension filter as the select
above it; the rail's own counts are all retained installations, so a quiet week
never makes a product look untracked. Legend chips switch lines on and off and
the last visible line cannot be switched off. Series colour is keyed to the
milestone, never to its position in the visible list, so hiding a line does not
repaint the others. Colours come from a validated categorical palette
(`--viz-1`..`--viz-6` in `globals.css`); three of them sit below 3:1 against the
light card, which is why the chart ships a table view.

The tab uses the shared extension and date filters, plus its own view,
extension-version, and UI-locale selectors. The default view is an **install
cohort**: installations whose `installed` event occurred inside the range,
followed to later milestones. A cohort whose range reaches into the last seven
days is marked incomplete because conversions arrive later. The **activity in
period** view counts events occurring inside the range; it is labelled as not a
strict funnel, because an older install can purchase during a newer period.
Installations with no `installed` event cannot join a cohort and are reported
separately rather than silently dropped. Use each event's `occurredAt`, not its later
upload time. Event retries are idempotent by `eventId`, and funnel steps count
distinct HMACed telemetry installation identifiers rather than requests or raw
rows.

`purchase_completed` must come from verified fulfillment, never from an
extension; the endpoint rejects the name outright if an extension sends it.
Joining it to an installation requires a purpose-built short-lived attribution
token. Never use the license key for analytics or expose the raw telemetry
installation UUID in a product URL. Until attribution exists, step 6 counts
verified website fulfillments inside the selected period and is displayed as a
website total beside the funnel, not as an installation-level conversion.

Run `npm run check:funnel` after changing ingestion or funnel arithmetic. It
exercises the library layer against the in-memory store: a mixed batch, a
replayed batch, the crash fan-out, the uninstall fallback shape, and the worked
example above.

## Local development

```bash
npm install
npm run dev
```

`npm run dev` reads `.env.local`, so a local dashboard writes to the **live**
Redis. To exercise ingestion or the dashboards without touching production
data, create `.env.sandbox` (gitignored) with an `ADMIN_TOKEN` and empty
`KV_REST_API_URL` / `KV_REST_API_TOKEN`, then run `npm run dev:sandbox`. With
no Redis credentials `lib/store.ts` falls back to its in-memory map and every
page shows the "Redis not configured" warning. That map lives in the dev
server's module instance, so a recompile clears it.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `CREEM_API_KEY` | Server-side Creem API key |
| `CREEM_API_URL` | Live or test Creem API base URL |
| `CREEM_WEBHOOK_SECRET` | Creem webhook signing secret |
| `ENFORCE_SUBSCRIPTIONS` | Enforcement is **on** by default. Set to `false` to record subscription state without acting on it |
| `MASTER_LICENSE_KEY` | Optional server-only key that bypasses Redis and unlocks every premium entitlement |
| `MASTER_LICENSE_PREFIX` | Optional server-only prefix; any key with a non-empty suffix bypasses Redis and unlocks every premium entitlement |
| `KV_REST_API_URL` / `UPSTASH_REDIS_REST_URL` | Redis REST URL |
| `KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |
| `NEXT_PUBLIC_GA_ID` | Optional GA4 measurement id override (defaults to `G-51L37C7EGC`) |
| `ADMIN_TOKEN` | Required shared secret for the private `/vault` and `/crash` dashboards |
| `CRASH_RETENTION_DAYS` | Optional crash-event retention in days (1–365, defaults to 90) |
| `FUNNEL_RETENTION_DAYS` | Optional funnel-installation retention in days (1–365, defaults to 90) |
| `CRASH_INSTALLATION_SALT` | Secret used to HMAC anonymous crash and funnel installation UUIDs before storage. Set in Production. Without it the code falls back to a constant in `lib/crashes.ts`, which is public, so a known UUID could be linked to its stored hash. Rotating it re-hashes every installation: existing rows keep their old hash and the same installation is counted as a new one from then on |
| `CRASH_ALERTS_ENABLED` | Set to `false` to disable new-issue and spike emails (enabled by default when SMTP is configured) |
| `CRASH_SPIKE_INSTALLATIONS` | Distinct installations in 15 minutes that trigger a spike alert (defaults to 3) |
| `EMAIL_LOG_RETENTION_DAYS` | Optional outbound-email audit retention in days (1–365, defaults to 90) |
| `SMTP_PASSWORD` | **Required for license emails.** Mailbox password for `info@verblike.com` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` | Optional SMTP overrides (default `mail.privateemail.com` / `465` / `info@verblike.com`) |
| `MAIL_FROM` | Optional From header (default `CleanMySocial <info@verblike.com>`) |

## License emails

Checkout requires an email address; it is sent to Creem both as the customer
email (so the buyer does not type it twice) and in the checkout metadata. On a
verified `checkout.completed` webhook the key is mailed from
`info@verblike.com` over SMTP (`lib/mail.ts`). A `mailed:<group>:<key>` marker
in Redis makes the send idempotent across Creem's webhook retries. If
`SMTP_PASSWORD` is unset, sending is skipped — the license is still granted.

The email names the product bought, links every tool in the set so the buyer can
install what they do not have, and states the 14-day no-questions refund.

Every outbound attempt is written to Redis for the private Email log described
under [Private dashboards](#private-dashboards).

## Abandoned checkouts

Pressing Buy now writes `pending:<group>:<key>` (email, plan, timestamp; 14-day
TTL) before redirecting to Creem. A successful grant deletes it. The sweep
(`lib/sweep.ts`) emails anyone whose pending record is 24h–7d old, once, after
re-checking that no active license exists. `remindedAt` on the record prevents a
second nudge.

**There is no scheduler of any kind.** A customer-triggered `/api/license`
verification may call `maybeSweep()`, which takes a Redis lock
(`sweep:abandoned`, 1h TTL) and only actually sweeps if it wins. Extensions do
not poll this endpoint: they call it only when the customer submits a key with
the Verify button. A run sends at most 5 emails; leftovers wait for a later
customer verification or payment-triggered maintenance run.

Trade-off: timing follows qualifying customer verification and payment traffic.
With no maintenance-triggering request, nothing is sent until the next one, so
reminders can arrive later than 24–25 hours when those triggers are quiet.

## Products and entitlements

`lib/products.ts` is the single source of truth: every Creem product id, its
price, and exactly which extension slug it unlocks. Nothing else derives
entitlements.

Each paid extension contributes three products through one `trio(...)` call — a
one-time 3-day pass, a recurring monthly product, and a one-time lifetime product. The
retired bundles, combos and old single prices stay at the bottom of the array,
marked `retired: true`, so old refunds, disputes, delayed webhooks and existing
licences still attribute correctly. **Never delete a product customers bought.**

A licence record holds `grants` (one per product+extension, with subscription
status and paid-through date), plus legacy `entitlements` and `products` fields.
Buying a second product **unions** with the first rather than replacing it.
Records written before per-product pricing have no `entitlements` field and are
read as the five-tool bundle those customers actually paid for —
`BUNDLE_ENTITLEMENTS` must therefore never gain the newer slugs.

### Creating the Creem products

Prices are fixed per product in Creem, so new prices mean new products. The
catalogue ships with `prod_PLACEHOLDER_…` ids, which are **never sellable**:

```bash
CREEM_API_KEY=... node scripts/create-creem-products.mjs --dry-run   # show what it would create
CREEM_API_KEY=... node scripts/create-creem-products.mjs             # create, then rewrite lib/products.ts
```

Re-running only fills in ids that are still placeholders. Commit the rewritten
`lib/products.ts` and deploy.

## Subscriptions

Creem sends every lifecycle event to `/api/creem/webhook`, which records status
and paid-through date on the grant. `lib/license.ts` then decides access:

| Grant state | Access |
| --- | --- |
| `lifetime` | always active |
| `pass` | active until `accessExpiresAt` (exactly 3 days from first fulfillment) |
| `active`, `trialing` | active |
| `scheduled_cancel` | active until `currentPeriodEnd` |
| `past_due` | active for 7 days past `currentPeriodEnd` |
| `canceled`, `expired`, `unpaid`, `paused` | blocked |
| refunded or disputed | blocked immediately |

Extensions learn about all of this only when the customer pastes a key and
clicks **Verify**:

```
GET /api/license?key=<key>&extension=<slug>
```

```jsonc
{
  "active": true,
  "access": "subscription",       // or "pass" / "lifetime"
  "expiresAt": 1789000000000,     // pass/period end; null for lifetime
  "expireAt": 1789000000000,      // effective client access boundary
  "subscriptionStatus": "active",
  "entitlements": ["instagram-dm-cleaner"],
  "subscriptionsEnforced": true
}
```

After successful verification, the extension stores the confirmed result and
does not contact the license endpoint again automatically. On extension
activation and side-panel/popup open, it compares local time with
`expireAt + 1 hour`. At or after that boundary it removes the stored key and
cached entitlement and returns to free access without a server request.
`expireAt: null` remains valid locally without expiry.

## User counts and screenshots

Both live on the extension in `lib/extensions.ts`.

- `users` / `usersUpdated` are typed in **by hand** from the public Chrome Web
  Store listing. The store has no public API, and a scraped number that silently
  goes stale becomes a false advertising claim. Display it as Chrome users,
  never as customers, purchases, downloads, or unique people.
- `screenshots` point at files in `public/screenshots/<slug>/`. See the README
  there.

## Editorial calendar and scheduled articles

The reusable blog route lives at `app/blog/[slug]/page.tsx`. Existing hand-written
articles remain in `content/blog/`; the 2026 search calendar is stored as structured
content in `lib/editorial-calendar.ts` so publication dates, product relationships,
pillar relationships, and internal links have one source of truth.

- Eight highest-opportunity pillar guides are published first. Six reuse and extend
  the site's strongest existing articles; the Facebook-post and Instagram-message
  pillars are generated from the editorial calendar.
- The remaining 52 guides publish from September 10 through October 5, 2026, exactly
  two per UTC day.
- `lib/blog.ts` excludes future articles from the blog index, article lookup, guide
  hubs, product-page guide lists, and sitemap.
- The blog index, guide hubs, article route, and sitemap revalidate hourly. This lets
  a due article become discoverable without a new deployment while keeping the rest
  of the site statically rendered.
- Publication eligibility is recomputed on each render, including on a warm server
  crossing midnight UTC. Product pages also revalidate hourly to expose new guides.
  Regeneration is request-driven: the first request after expiry can receive the
  previous cached page while its replacement is generated.
- Supporting articles link to their pillar and product page. The related-guide UI
  includes only articles already published, preventing links to scheduled 404s.
- Product pages link back to their published pillar and focused guides, completing
  the product → pillar → supporting-article structure.

To test a release boundary without changing dates, set `CONTENT_NOW` to an ISO date
while building. For example, `CONTENT_NOW=2026-09-10 npm run build` should expose the
first two scheduled supporting guides; the previous day should expose none of them.
Run `node scripts/check-content.mjs` to verify all release dates, the eight pillars,
and published-only links while advancing time in one server-module instance.

The original research and 60-row brief live in
`../outputs/01a02e7e-2a36-77a1-b6cc-6addef1af368/CleanMySocial_keyword_opportunities_2026-09-09.xlsx`.
Its primary keywords match all 60 calendar targets. The workbook also retains
supporting keywords, angles, CTAs, search volumes, priority scores, and overlap
guidance. The implementation advances its eight pillars ahead of the supporting
schedule, ending October 5 instead of the workbook's original October 9.

## Production setup

1. Deploy this folder as a Vercel project.
2. Set the environment variables above.
3. Attach `cleanmysocial.com`, `www.cleanmysocial.com`, and the legacy
   `cleanmysocial.verblike.com` domain. Do not configure a Vercel domain-level
   redirect for the legacy host: published extension versions are permitted to
   call only that origin. `middleware.ts` redirects legacy website pages to the
   canonical apex domain while deliberately serving `/api/*` on every attached
   host. Public `www` pages permanently redirect to the matching apex URL.
4. Set the Creem webhook to
   `https://cleanmysocial.com/api/creem/webhook` for checkout,
   refund, dispute, and subscription events.
5. Products are created in Creem and their ids pasted into `lib/products.ts`.
   Creem prices are immutable, so a price change means a new product: add it,
   mark the old one `retired`.

## License flow

The website creates the license key during checkout and delivers it on the
success page and by email. The extension never creates a licensing identity and
never polls. It sends a request only after the customer pastes a key and clicks
**Verify**, stores the key only after an active response, and trusts the cached
result locally until `expireAt + 1 hour`. The next activation or side-panel/
popup open at or after that boundary deletes the key and cached entitlement.
