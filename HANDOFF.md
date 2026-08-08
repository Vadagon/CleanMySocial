# CleanMySocial — licensing incident handoff

Context package for an LLM picking this up cold. Written 2026-08-07.
Everything below was verified against live production, not inferred.

## Incident update — 2026-08-08

Two new paid checkouts remained pending:

- `83981f46-23d1-4c23-921a-26cb7d65b391` — Messenger Cleaner
- `9676bd54-5412-4a6a-b1c6-56c8e0029651` — Facebook & Instagram Messages

Production Vercel logs contain one webhook POST at each purchase time; both
returned HTTP 401. `CREEM_WEBHOOK_SECRET` exists in the Production environment,
so the configured value does not match the signing secret of the currently
registered live Creem webhook. The HMAC-SHA256 implementation itself matches
Creem's current documentation. The correct live secret still must be copied
from Creem → Developers → Webhooks into Vercel, followed by a redeploy and a
resend of a failed event. Do not weaken or bypass webhook verification.

Both owner-confirmed payments were reconciled with
`scripts/reconcile-paid-pending.mjs`. They now have active lifetime records
with their exact single-product entitlements and manual audit fields, and the
matching pending records were atomically deleted. A subsequent `--verify` run
confirmed both records in production Redis.

The application now also has a second, independently verified fulfillment
path for new purchases. Creem redirects successful checkouts with a SHA-256
signature made with the API key; `/api/creem/confirm` verifies that signature,
looks the checkout up through Creem's API, requires `status=completed` and
matching checkout/key/product IDs, then uses the same idempotent grant-and-mail
function as the webhook. New checkout success URLs contain no custom query
parameters so Creem's documented signing order is preserved exactly. This
protects buyers who return to the success page while the webhook configuration
is being repaired, but it does not replace the webhook for refunds, disputes,
or buyers who close the checkout without returning.

## Resolution update — 2026-08-07

The production incident described below is resolved as of commit `249e5ed`.

- Checkout creation for the current $19 product was verified against Creem.
- A correctly signed production webhook was verified end to end: Redis licence,
  all three entitlements, public licence API, and SMTP acceptance all passed.
- Missing attribution and mail failure now return 500, so Creem retries instead
  of recording incomplete fulfilment as successful.
- Duplicate webhook deliveries are mail-idempotent, and `request_id` is a
  fallback for the licence key when metadata is absent.
- The retired `CREEM_BUNDLE_PRODUCT_ID` override was replaced with the current
  product id in Vercel.
- The stranded review licences were re-homed under `cleanmysocial`.
- Historical records were reconciled against Creem: confirmed keys for Alan,
  Sven, and Clayton were mailed and verified active; three zero-payment
  backfill records were deactivated with a 30-day recovery trail; no pending
  checkout records remain.
- Alan has two confirmed $8 payments. No refund was issued because that is a
  separate financial decision requiring explicit owner authorization.

Sections 3–8 retain the original incident evidence and work log for audit
purposes; statements phrased in the present tense there describe the state at
the time of investigation, not the current production state.

---

## 1. The product

`cleanmysocial.verblike.com` is a Next.js 15 (App Router) marketing site on
Vercel that sells Chrome extensions and hosts their shared licence API.

Five extensions, three of them premium (licensed):

| Slug | Name | Repo folder |
| --- | --- | --- |
| `facebook-instagram-cleaner` | Delete All Messages for Facebook & Instagram | `FB+IG_messages_cleaner` |
| `facebook-messenger-cleaner` | Messenger Cleaner | `facebook-messenger-cleaner` |
| `mass-unfriender` | Mass Friends Remover | `mass-friends-remover-facebook` |

Two are free and never touch licensing: `instagram_DM-cleaner`,
`ig-followers-tracker`.

Payments run through **Creem** (not Stripe, not Paddle — though old records
still carry a `paddleId` field from a previous era). State lives in **Upstash
Redis** over the REST API.

### Repo layout

The site is `cleanmysocial/` inside a parent folder that also holds each
extension. Only `cleanmysocial/` is a git repo; the extensions are separate
repos. Branch `main`, remote `Vadagon/CleanMySocial`.

---

## 2. How licensing is supposed to work

1. An extension generates an anonymous install key (a UUID) and stores it in
   `chrome.storage.sync`.
2. Buyer clicks Buy now → `POST /api/creem/checkout` creates a Creem checkout
   with `metadata: {key, extension, plan, email, product_id, entitlements}` and
   writes `pending:cleanmysocial:<key>` (14-day TTL).
3. Buyer pays → Creem POSTs `checkout.completed` to
   `/api/creem/webhook` with a `creem-signature` header (hex HMAC-SHA256 of the
   raw body, keyed with `CREEM_WEBHOOK_SECRET`).
4. The webhook writes `license:cleanmysocial:<key>`, deletes the pending
   record, and emails the key over SMTP (guarded by a `mailed:<group>:<key>`
   marker for idempotency).
5. The extension polls
   `GET /api/license?extension=<slug>&key=<key>` and unlocks on `active: true`.

**Licence records are stored per *group*, not per extension.** The group is the
literal string `cleanmysocial`. One record per key, regardless of what was
bought; which tools it unlocks is the `entitlements` array inside the record.

Key files:

| File | Role |
| --- | --- |
| `lib/products.ts` | Single source of truth: Creem product ids → entitlement slugs |
| `lib/license.ts` | Record shape, `grantLicense`, `entitlementsOf`, `entitles`, `isActive` |
| `lib/store.ts` | Upstash REST wrapper (`kvGet/kvSet/kvSetNx/kvScan/kvGetManyWithTtl`) |
| `lib/pending.ts` | Abandoned-checkout records |
| `lib/sweep.ts` | Traffic-driven reminder sweep (no cron; `/api/license` triggers it under a 1h Redis lock) |
| `lib/records.ts` | Read-only view over the whole keyspace, powers `/vault` |
| `app/api/creem/webhook/route.ts` | The **only** place `grantLicense` is called |
| `app/api/license/route.ts` | Validation endpoint the extensions poll |
| `app/vault/` | Private admin record browser (see §6) |

---

## 3. THE INCIDENT — original failure state

**No purchase has ever produced a licence.** Verified against production Redis:
13 keys total — 9 `pending:`, 3 `license:`, 1 `sweep:` lock. All three licence
records are hand-made review grants from 2026-07-11 carrying `paddleId`. There
are **zero `mailed:*` markers**, and `mailKey()` writes one on every successful
grant, which proves `grantLicense()` has never run in production.

### Root cause A — `access` was undefined, so the grant guard failed

The code live during the affected checkouts (commit `bb611df`,
`app/api/creem/webhook/route.ts`) derived attribution as:

```ts
const productId = productIdFrom(obj);            // parsed from Creem payload
const mapped    = productId ? findByProductId(productId) : undefined;
const extension = meta?.extension || ...         // OK — from metadata
const plan      = meta?.plan      || ...         // OK — from metadata
const access    = mapped?.plan.access;           // BROKEN — no metadata fallback
```

guarded by `if (key && extension && plan && access)`.

`findByProductId` at that commit returned `undefined` for anything except one
exact id (`prod_4tUdIIAOSGXJAxFUapCPdh`, the retired $8 bundle):

```ts
if (productId !== BUNDLE_PLAN.productId) return undefined;
```

So `access` was `undefined`, the guard failed, the handler fell to
`console.warn("[creem] grant missing attribution")` — **and still returned HTTP
200**. Creem recorded success and never retried. Every payment was silently
dropped.

Note the asymmetry that made this invisible: `extension` and `plan` had
metadata fallbacks and were fine (the pending records prove it — all show
`cleanmysocial` / `lifetime`). Only `access` depended solely on the product
lookup.

**Partially fixed already.** Current `main` adds `meta?.product_id ||
productIdFrom(obj)` and the checkout route now puts `product_id` in metadata,
so the lookup should resolve for *new* purchases. But `access` is still
`product ? "lifetime" : undefined` — contingent on `getProduct()` resolving. It
has no independent fallback. **This has not been verified with a real
purchase.**

### Root cause B — three review licences are unreachable

`app/api/license/route.ts` hardcodes `GROUP = "cleanmysocial"` and only ever
reads `license:cleanmysocial:<key>`. The stored records are at:

```
license:mass-unfriender:verblike-review-c426351d75dc
license:mass-unfriender:verblike-review-f04ade6fa389
license:messenger-cleaner:verblike-review-f04ade6fa389
```

Nothing reads those paths. Confirmed live — every slug variant returns
`active:false`. The request's `extension` param is used *only* to pick an
entitlement to check, never to locate the record.

This is independent of Root cause A. Anyone testing with a review key would see
failure even on a perfectly working webhook.

### What is NOT broken

- The extension client. `FB+IG_messages_cleaner/src/background/service-worker.js:237`
  asks as `facebook-instagram-cleaner`, which is a valid `SLUG_ALIASES` entry.
- Legacy-record handling. `entitlementsOf()` treats a missing `entitlements`
  field as the full bundle, so pre-per-product customers keep access.
- The webhook endpoint itself: reachable, `GET` → `{"ok":true}`, unsigned POST →
  401.

### Still unknown — needs data this analysis could not reach

Redis looks identical whether the webhook 401'd on signature or 200'd and
skipped. **Check Creem's webhook delivery log:**

- all **401** → `CREEM_WEBHOOK_SECRET` unset/wrong in Vercel (`verifySignature`
  returns false immediately on an empty secret)
- all **200** → confirms Root cause A; Vercel function logs will show
  `[creem] grant missing attribution` with `access: undefined`
- **no deliveries** → endpoint never registered in Creem

---

## 4. Customer impact

Nine pending records, 2026-08-06 → 08-07, all `cleanmysocial` / `lifetime`.
Owner states many of these completed payment successfully.

Caution for whoever acts on this: **five of the nine belong to one person**
(`alanoxlaj0`), two of those with a typo'd domain (`@gmial.com`, not
`@gmail.com`). That pattern reads as repeated retries by someone who never
received a key, not five separate purchases. Granting all nine blindly mints
five lifetime keys for one buyer. Cross-check against Creem's payment list
before or after granting.

There is **no backfill path in the app** — `grantLicense` is called from exactly
one place, the webhook. Fixing the code does nothing for anyone who already
paid. See `scripts/backfill-licenses.mjs` (§5).

---

## 5. Work already done

- **`/vault`** — private admin record browser, live. See §6.
- **`scripts/backfill-licenses.mjs`** — written and reviewed, **not yet run**.
  Dry run by default; `--apply` writes. It (a) grants a full-bundle lifetime
  licence at `license:cleanmysocial:<key>` for every `pending:` record, (b)
  re-homes the three stranded review licences into the group path, (c) deletes
  pending records it satisfied. Idempotent — skips keys that already hold the
  full bundle. Stamps `backfilledAt` / `backfillSource` for an audit trail.
  Deliberately sends no email. Leaves the mis-grouped originals in place as
  history.
  **Blocked on Upstash credentials**, which are only in Vercel:
  ```bash
  node --env-file=.env.local scripts/backfill-licenses.mjs          # dry run
  node --env-file=.env.local scripts/backfill-licenses.mjs --apply  # commit
  ```
  needs `KV_REST_API_URL` and `KV_REST_API_TOKEN` in `.env.local`.

### Deploy state — read this before assuming git reflects production

Production `main` was stale at a single Aug-4 commit while the live site ran
branch code promoted through the Vercel dashboard. On 2026-08-07 the branch
`agent/update-unfriender-privacy` (14 commits) was fast-forward merged to `main`
and pushed, at the owner's explicit instruction. That deploy took the bundle
price **$8 → $19** live and shipped per-product entitlements plus a commit
literally titled `WIP`.

**Unverified risk from that deploy:** the pricing page now sells
`prod_4ubelL19379mVaGmYhhibs`. If that id does not exist in the Creem account,
`/api/creem/checkout` returns 502 and nobody can buy anything. Confirm the id in
Creem.

---

## 6. The /vault admin browser

`https://cleanmysocial.verblike.com/vault` — table of every Redis key with
search, type filters (`license` / `pending` / `reminded` / `sweep` / `other`),
sorting, an active-licences-only toggle, expandable raw JSON, and JSON export.

- Auth: `ADMIN_TOKEN` env var, timing-safe compare in `lib/admin.ts`. Unset →
  503 (fails closed, never open). Token is held in `localStorage`.
- Hidden from crawlers three ways: `app/robots.ts` disallows `/vault` and
  `/api/`; page metadata sets `noindex`; `next.config.js` sets `X-Robots-Tag`
  (in Next config rather than `vercel.json` so it survives a host change).
- API: `GET /api/admin/records?pattern=<glob>` with `x-admin-token`. Read-only.
  Reads are pipelined (`kvGetManyWithTtl`, GET+TTL batched 100 at a time).

**Outstanding security note:** the production token is currently the weak string
`100k100k100k`, guarding customer emails and licence keys on a public URL with
no rate limiting. Recommend rotating to `openssl rand -base64 32`. The owner
chose the weak value knowingly. Also: `README.md` documents no `ADMIN_TOKEN`
row and no `/vault` section — that gap should be closed.

---

## 7. Environment variables

`CREEM_API_KEY`, `CREEM_API_URL`, `CREEM_WEBHOOK_SECRET`,
`CREEM_BUNDLE_PRODUCT_ID` (optional override; ignored with a warning if it names
an unknown or retired product), `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or
`UPSTASH_REDIS_REST_*`), `SMTP_PASSWORD` (+ optional `SMTP_HOST` / `SMTP_PORT` /
`SMTP_USER` / `MAIL_FROM`), `NEXT_PUBLIC_GA_ID`, and `ADMIN_TOKEN`.

---

## 8. Suggested order of work

1. **Verify the $19 product id in Creem.** If it's wrong, checkout is dead right
   now and nothing else matters.
2. **Read Creem's webhook delivery log** to settle 401-vs-200 (§3). This decides
   whether the remaining fix is the secret or the grant guard.
3. **Run the backfill** dry-run, reconcile the nine against Creem's actual
   payments, then `--apply`.
4. **Harden the webhook**: give `access` a metadata fallback and default it to
   `"lifetime"` for one-time products; treat missing attribution as a **non-200**
   so Creem retries instead of silently succeeding; log the full payload shape
   on failure.
5. **Fix Root cause B**: either re-home the review licences (the script does
   this) or make `getLicense` fall back to legacy group paths.
6. **Decide on key delivery** to the nine affected customers — the backfill
   script intentionally does not email. Sending real mail to real customers is
   the owner's call.
7. Rotate `ADMIN_TOKEN`; document `/vault` in `README.md`.

## 9. Conventions worth matching

Comments in this codebase explain *why*, not *what*, and are written in prose —
see `lib/sweep.ts` or `lib/products.ts` for the register. Money and access paths
fail closed. Analytics and email must never break a request. Don't add a
scheduler; the sweep is deliberately traffic-driven.
