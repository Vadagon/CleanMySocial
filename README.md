# CleanMySocial

Marketing site, legal pages, Creem checkout, and shared-license API for the
CleanMySocial bundle at `cleanmysocial.verblike.com`.

One $8 lifetime product unlocks the three premium extensions:

- Delete All Messages for Facebook & Instagram
- Messenger Cleaner – Delete All Facebook Messages
- CleanMySocial Mass Unfriender

Two extensions are free and use neither checkout nor licensing:

- DM Cleaner – Bulk Delete Instagram Messages
- Followers Tracker for Instagram — Unfollowers & Bulk Unfollow

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
| `CREEM_BUNDLE_PRODUCT_ID` | The single CleanMySocial product ID; defaults to the existing $8 lifetime product |
| `KV_REST_API_URL` / `UPSTASH_REDIS_REST_URL` | Redis REST URL |
| `KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |
| `NEXT_PUBLIC_GA_ID` | Optional GA4 measurement id override (defaults to `G-51L37C7EGC`) |
| `SMTP_PASSWORD` | **Required for license emails.** Mailbox password for `info@verblike.com` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` | Optional SMTP overrides (default `mail.privateemail.com` / `465` / `info@verblike.com`) |
| `MAIL_FROM` | Optional From header (default `CleanMySocial <info@verblike.com>`) |
| `CRON_SECRET` | Bearer token Vercel sends to the cron route; when set, unauthenticated calls are rejected |

## License emails

Checkout requires an email address; it is sent to Creem both as the customer
email (so the buyer does not type it twice) and in the checkout metadata. On a
verified `checkout.completed` webhook the key is mailed from
`info@verblike.com` over SMTP (`lib/mail.ts`). A `mailed:<group>:<key>` marker
in Redis makes the send idempotent across Creem's webhook retries. If
`SMTP_PASSWORD` is unset, sending is skipped — the license is still granted.

The email names the product bought, lists the three unlocked extensions, states
the 14-day no-questions refund, and cross-promotes the two free extensions.

## Abandoned checkouts

Pressing Buy now writes `pending:<group>:<key>` (email, plan, timestamp; 14-day
TTL) before redirecting to Creem. A successful grant deletes it. The sweep
(`lib/sweep.ts`) emails anyone whose pending record is 24h–7d old, once, after
re-checking that no active license exists. `remindedAt` on the record prevents a
second nudge.

**There is no platform cron.** `/api/license` — polled by every installed
extension — calls `maybeSweep()`, which takes a Redis lock (`sweep:abandoned`,
1h TTL) and only actually sweeps if it wins. Everyone else pays one Redis round
trip. A run sends at most 5 emails so it can never stall a user's request;
leftovers go out on the next sweep. This needs no Vercel Pro plan, no external
scheduler, and no configuration.

Trade-off: timing follows traffic. With no requests for a day, nothing is sent
until the next one. Reminders therefore land 24h–25h after checkout while
traffic is steady, later if the site goes quiet.

`GET /api/cron/abandoned-checkout` still exists for forcing a run by hand (or
for an external scheduler) and clears the whole backlog rather than 5. It
requires `Bearer $CRON_SECRET` when that variable is set.

## Production setup

1. Deploy this folder as a Vercel project.
2. Set the environment variables above.
3. Attach `cleanmysocial.verblike.com`.
4. In Creem, rename the existing $8 lifetime product to **CleanMySocial** and
   describe it as one license for all three premium extensions. If a new product is
   created instead, set `CREEM_BUNDLE_PRODUCT_ID`.
5. Set the Creem webhook to
   `https://cleanmysocial.verblike.com/api/creem/webhook` for checkout,
   refund, dispute, and subscription events.
6. Update all three premium extensions to open the new domain. License checks may send
   either their legacy slug or `cleanmysocial`; the API normalizes both.

## License flow

The extension supplies an anonymous install key as `?lk=...`. Checkout sends
that key and the `cleanmysocial` license group as Creem metadata. A verified
webhook grants a lifetime record in Redis. All three legacy extension slugs map
to the same shared record at `/api/license`.
