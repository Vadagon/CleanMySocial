# CleanMySocial

Marketing site, legal pages, Creem checkout, and shared-license API for the
CleanMySocial bundle at `cleanmysocial.verblike.com`.

Three premium extensions are licensed:

- Delete All Messages for Facebook & Instagram
- Messenger Cleaner – Delete All Facebook Messages
- Mass Friends Remover for Facebook

Two are free and use neither checkout nor licensing:

- DM Cleaner – Bulk Delete Instagram Messages
- Followers Tracker for Instagram — Unfollowers & Bulk Unfollow

The site sells them as one $19 lifetime bundle. Single-tool and combo
products exist too, but are not on sale yet — see **Products and
entitlements**.

## Analytics

Google Analytics 4 (`G-51L37C7EGC`, the `cleanmysocial.verblike.com` stream)
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
| `CREEM_BUNDLE_PRODUCT_ID` | Optional override for which bundle is sold. Ignored (with a warning) if it names an unknown or retired product — otherwise Buy now carries an unbuyable id and every purchase 400s |
| `KV_REST_API_URL` / `UPSTASH_REDIS_REST_URL` | Redis REST URL |
| `KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |
| `NEXT_PUBLIC_GA_ID` | Optional GA4 measurement id override (defaults to `G-51L37C7EGC`) |
| `SMTP_PASSWORD` | **Required for license emails.** Mailbox password for `info@verblike.com` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` | Optional SMTP overrides (default `mail.privateemail.com` / `465` / `info@verblike.com`) |
| `MAIL_FROM` | Optional From header (default `CleanMySocial <info@verblike.com>`) |
| `NEXT_PUBLIC_SELL_INDIVIDUAL` | Set to `1` to put singles and combos on sale. Leave unset until the extension updates have rolled out — see below |

## License emails

Checkout requires an email address; it is sent to Creem both as the customer
email (so the buyer does not type it twice) and in the checkout metadata. On a
verified `checkout.completed` webhook the key is mailed from
`info@verblike.com` over SMTP (`lib/mail.ts`). A `mailed:<group>:<key>` marker
in Redis makes the send idempotent across Creem's webhook retries. If
`SMTP_PASSWORD` is unset, sending is skipped — the license is still granted.

The email names the product bought, links every tool in the set so the buyer can
install what they do not have, and states the 14-day no-questions refund.

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
price, and exactly which extension slugs it unlocks. Nothing else derives
entitlements.

| Price | Unlocks |
| --- | --- |
| $19 | all three premium extensions (the bundle we sell) |
| $16 | Delete All Messages + Messenger Cleaner |
| $14 | Messenger Cleaner + Mass Friends Remover |
| $12 / $9 / $7 | one extension each |
| $8 | the original bundle — `retired`, never sold again, kept resolvable so old refunds and disputes still attribute |

A license record holds `entitlements` (slugs) and `products` (what was paid
for). Buying a second product **unions** with the first rather than replacing
it. Records written before per-product pricing have no `entitlements` field and
are read as full bundles, so earlier customers keep what they paid for.

### Why singles and combos are not on sale yet

`/api/license` can only be precise if the caller says which extension it is.
Extensions that ask as `cleanmysocial` — the group — get a permissive answer:
active if the key has *any* entitlement. Every published build did that until
now, so a $7 purchase would unlock all three.

The three premium extensions have been updated to send their own slug
(`facebook-instagram-cleaner`, `facebook-messenger-cleaner`, `mass-unfriender`).
Once those builds are published and adopted, set `NEXT_PUBLIC_SELL_INDIVIDUAL=1`.
Turning it on earlier undercharges; the code is otherwise ready.

## Ratings and screenshots

Both live on the extension in `lib/extensions.ts`.

- `rating` / `reviews` / `ratingsUpdated` are typed in **by hand** from the live
  Chrome Web Store listing. The store has no public API, and a scraped number
  that silently goes stale becomes a false advertising claim. Under five
  reviews nothing is shown; `newRelease` says "New release" instead.
- `screenshots` point at files in `public/screenshots/<slug>/`. See the README
  there.

## Production setup

1. Deploy this folder as a Vercel project.
2. Set the environment variables above.
3. Attach `cleanmysocial.verblike.com`.
4. Set the Creem webhook to
   `https://cleanmysocial.verblike.com/api/creem/webhook` for checkout,
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
