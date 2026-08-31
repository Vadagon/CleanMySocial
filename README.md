# CleanMySocial

Marketing site, legal pages, Creem checkout, and shared-license API for
CleanMySocial products at `www.cleanmysocial.com`.

## The extensions

Nine extensions: eight paid, one free. Every paid tool is sold **on its own**
with a one-time 3-day pass, a monthly subscription, or lifetime access. There
are no bundles or combos. Monthly is the recommended/default offer.

| Extension | Slug | 3 days | Monthly | Lifetime | Store ID |
| --- | --- | ---: | ---: | ---: | --- |
| Delete All Messages for Facebook & Instagram | `facebook-instagram-cleaner` | $5.99 | $11.99 | $34.99 | `cboolboidgkagffpalhlojepcghkkfej` |
| Messenger Cleaner | `facebook-messenger-cleaner` | $3.99 | $6.99 | $19.99 | `imobgpikmofiapbnijmebknbkmkncdkl` |
| Mass Friends Remover for Facebook | `mass-unfriender` | $4.99 | $8.99 | $27.99 | `fegkbiinmaoipoonnlhekdoefgebmdnj` |
| DM Cleaner for Instagram | `instagram-dm-cleaner` | $4.99 | $7.99 | $24.99 | `aekeomcopkngciopbjbdmlmpgfdcndmm` |
| Followers Tracker for Instagram | `instagram-followers-tracker` | $4.99 | $8.99 | $29.99 | `kfaklckklmlknieiniakbekofgndfpbp` |
| Reddit Cleaner | `reddit-cleaner` | $4.99 | $9.99 | $29.99 | `ghddfkljkcojgpdngeaglannonehpldh` |
| CleanerX for X (Twitter) | `cleanerx` | $4.99 | $9.99 | $29.99 | `efkdbehpkfaiehogkiokbiecjdbiebgi` |
| Facebook Activity Log Cleaner | `facebook-activity-cleaner` | $4.99 | $9.99 | $29.99 | `iaimbgcccpmmdgpmkkcaiilgdeobgmcl` |
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

Google Analytics 4 (`G-51L37C7EGC`, the `www.cleanmysocial.com` stream)
loads from `app/GoogleAnalytics.tsx`, only in production builds. Override the
id with `NEXT_PUBLIC_GA_ID`, or set it to an empty string to disable.

## Local development

```bash
npm install
npm run dev
```

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
| `CRASH_INSTALLATION_SALT` | Recommended secret used to HMAC anonymous crash installation UUIDs before storage |
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

Every outbound attempt is also written to Redis for the admin-only **Email log**
tab at `/crash`. It records addresses, subject, plain-text and HTML content,
delivery status, SMTP message id, and product/extension context. Failed,
rejected, and skipped attempts are retained as well. The default retention is
90 days; change it with `EMAIL_LOG_RETENTION_DAYS`. Because license emails
contain license keys, keep `ADMIN_TOKEN` private and never expose this endpoint.

## Abandoned checkouts

Pressing Buy now writes `pending:<group>:<key>` (email, plan, timestamp; 14-day
TTL) before redirecting to Creem. A successful grant deletes it. The sweep
(`lib/sweep.ts`) emails anyone whose pending record is 24h–7d old, once, after
re-checking that no active license exists. `remindedAt` on the record prevents a
second nudge.

**There is no scheduler of any kind.** `/api/license` — polled by every installed
extension — calls `maybeSweep()`, which takes a Redis lock (`sweep:abandoned`,
1h TTL) and only actually sweeps if it wins. Everyone else pays one Redis round
trip. A run sends at most 5 emails so it can never stall a user's request;
leftovers go out on the next sweep. Nothing to configure, no plan features
required.

Trade-off: timing follows traffic. With no requests for a day, nothing is sent
until the next one. Reminders therefore land 24h–25h after checkout while
traffic is steady, later if the site goes quiet.

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

Extensions learn about all of this from the endpoint they already poll:

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

An extension needs no new code to handle cancellation: `active` flips to `false`
once the period ends. Reading `expiresAt` only buys a nicer message ("your plan
ends on …") before that happens.

## User counts and screenshots

Both live on the extension in `lib/extensions.ts`.

- `users` / `usersUpdated` are typed in **by hand** from the public Chrome Web
  Store listing. The store has no public API, and a scraped number that silently
  goes stale becomes a false advertising claim. Display it as Chrome users,
  never as customers, purchases, downloads, or unique people.
- `screenshots` point at files in `public/screenshots/<slug>/`. See the README
  there.

## Production setup

1. Deploy this folder as a Vercel project.
2. Set the environment variables above.
3. Attach both `www.cleanmysocial.com` and the legacy
   `cleanmysocial.verblike.com` domain. Do not configure a Vercel domain-level
   redirect for the legacy host: published extension versions are permitted to
   call only that origin. `middleware.ts` redirects legacy website pages to the
   canonical domain while deliberately serving `/api/*` on both hosts.
4. Set the Creem webhook to
   `https://www.cleanmysocial.com/api/creem/webhook` for checkout,
   refund, dispute, and subscription events.
5. Products are created in Creem and their ids pasted into `lib/products.ts`.
   Creem prices are immutable, so a price change means a new product: add it,
   mark the old one `retired`.

## License flow

The extension supplies an anonymous install key as `?lk=...`. Checkout sends
that key, the license group, the product id and its entitlements as Creem
metadata. A verified webhook grants a lifetime record in Redis under
`license:cleanmysocial:<key>` — one record per key, whatever was bought — and
`/api/license` answers per-extension from its entitlements.
