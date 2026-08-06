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
