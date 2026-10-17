# Cloudflare Community Feedback API

This is an independent **Cloudflare Worker + D1** service. It is intentionally separate from the legacy Fastify/MongoDB/Socket.IO backend. It never creates fake tournaments, player counts, or accounts.

## Configure once (Cloudflare access required)

1. In a Cloudflare account with Workers + D1, run:
   - cd community-worker
   - npx wrangler d1 create e-sport-community
2. Copy wrangler.toml.example to wrangler.toml and replace the placeholder UUID from the D1 create output. Do **not** commit real IDs or secrets unnecessarily.
3. Apply schema: npx wrangler d1 migrations apply e-sport-community --remote
4. Set secrets **on the Worker**:
   - npx wrangler secret put RATE_LIMIT_SALT (strong random value, 32+ chars)
   - npx wrangler secret put FEEDBACK_ADMIN_TOKEN (strong random value, 32+ chars)
   - npx wrangler secret put COMMUNITY_PROXY_SECRET (same strong random value as Vercel, 32+ chars)
5. Deploy: npx wrangler deploy
6. Add Vercel **server-only** environment variable COMMUNITY_PROXY_SECRET matching the Worker secret. Add **server-only** COMMUNITY_API_ORIGIN to the exact HTTPS Worker origin (for example https://your-real-worker.workers.dev). Redeploy the Next.js frontend. Do not put this in NEXT_PUBLIC_ variables.
7. Check GET /health returns 200 with database:true and test POST from the website /feedback.

The website's same-origin Next.js route proxies public GET and POST. If the Worker is unavailable or the Vercel environment variable is missing, the UI displays a real service-unavailable state and does not claim submission succeeded.

## Public API
- GET /health: ready check, 503 when DB binding is absent
- GET /api/feedback: moderated public list only, no pending/rejected content
- POST /api/feedback: JSON type (feature|bug|experience), title (8-100), description (20-1200), alias optional (<=40); returns 201 and status pending
- Request rate limit: 3 submissions per trusted client IP per UTC day. The Vercel proxy signs a daily pseudonymous visitor ID; Worker validates the signature. Direct Worker callers are limited by Cloudflare CF-Connecting-IP. No raw IP persisted. Missing salt, shared proxy secret, or client IP fails closed.
- Origin for browser POST must match ALLOWED_ORIGIN. Cross-origin callers without Origin (e.g., curl) can call the public API but are rate limited.

## Moderation (private)
- GET /api/feedback?scope=admin with header Authorization: Bearer <FEEDBACK_ADMIN_TOKEN> lists all statuses.
- POST /api/feedback/<id>/moderate with same auth and JSON {"status":"approved|planned|in_progress|shipped|rejected"}.
- Never expose admin token to a frontend bundle or to users. Consider an authenticated moderation dashboard and Turnstile before public launch if traffic increases.

## Maintenance and data
Back up D1 via Cloudflare before destructive migrations. This migration does not import or alter old MongoDB users or transactions. The feedback service should be rolled out independently from auth, marketplace, and tournament migration. Periodically remove old feedback_limits rows (retain only recent days); secret rotation invalidates rate-limit hashes by design.

## Test
node --test tests/*.test.mjs

NOTE: This repository cannot self-provision your Cloudflare account or configure your Vercel environment. The two account-side bindings above are required before live submissions will work.

## Tournament catalog (D1)

Apply both migrations before deploying. The tournament list is **real data only**; the database intentionally has no sample tournaments. The frontend displays an honest empty state until a verified event is published.

- GET /api/tournaments?limit=20 — published events only (max 50).
- GET /api/tournaments/<id> — published event detail.
- POST /api/tournaments — administrator-only creation. Required fields: title, description, format, venue, organizer, game, status, starts_at (UTC ISO 8601), registration_closes_at (nullable UTC ISO 8601), max_teams (2-1024), prize_pool_mnt (nonnegative integer), registration_url (HTTPS or empty), published (boolean). New events should normally start with published=false until verified.
- POST /api/tournaments/<id>/status — administrator-only change of status and published flag. Requires both status and published fields.

The Worker rejects unsafe registration URL schemes. Registration is hosted externally until a proper user-authenticated tournament registration system is migrated; no fake registration or payment flow is displayed. Do not expose the administrator credential in any browser bundle.

The Worker includes a UTC midnight scheduled task that deletes rate-limit fingerprints older than seven days. Cron configuration is in wrangler.toml.example; ensure it is copied to the actual Wrangler configuration.
