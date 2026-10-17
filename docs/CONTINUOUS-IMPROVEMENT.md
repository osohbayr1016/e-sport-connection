# E-Sport Connection — Continuous improvement checkpoint

## Current phase: Community platform recovery
Default/deploy branch: sport.
Feature branch: feat/community-feedback-worker-d1.
Current project scope: restore a useful Mobile Legends community website without making up player data, while incrementally moving the legacy Fastify + MongoDB backend to Cloudflare Workers + D1.

## Audited baseline (2026-10-18)
- Public Vercel homepage currently displays 0 active players, 0 news, 0 ongoing tournaments.
- Existing backend uses Fastify/MongoDB and Socket.IO. A full migration cannot safely be achieved by only swapping the API base URL; authentication, chat and tournament schema need separate migrations.
- The repo has checked-in backend/.env and backend/.env.backup, backend/node_modules and a SQLite development database. Treat all secrets as COMPROMISED and rotate them; deleting tracked files does not purge Git history.
- Frontend has Next.js routes that proxy to legacy backend and next.config.ts suppresses TypeScript/ESLint build errors.
- Production deployed via Vercel from sport branch; confirm Vercel project settings independently before merging.

## Cycle 1 implementation
- Independently deployable Cloudflare Worker with D1 schema for community feedback.
- Anonymous feature/bug/experience submissions, strict input bounds, honeypot, salted daily IP hashing and a daily cap.
- Pending submissions hidden from public; administrator bearer authorization for moderation.
- Next.js same-origin server-side feedback API proxy with 503 when not configured.
- New /feedback frontend and redesigned Mobile Legends-first homepage; navigation entry to feedback.
- GitHub Actions workflow for Worker node tests and frontend build/Jest checks.

## Important deployment blockers and next steps
1. **MUST DO FIRST:** Rotate leaked credentials found in tracked .env files (MongoDB credentials, API keys, session secrets, Cloudinary/OAuth tokens etc.). Never print or commit the values. Safely remove tracked secrets, dev DB, and node_modules from the repository and add root .gitignore; removing does NOT rewrite history.
2. Review this feature branch's changed files and CI. Fix failures before merge.
3. In Cloudflare account, create D1 e-sport-community and configure real Wrangler UUID, RATE_LIMIT_SALT and FEEDBACK_ADMIN_TOKEN; apply migrations, deploy Worker. Details in community-worker/README.md.
4. Set Vercel server-only COMMUNITY_API_ORIGIN to deployed Worker origin and COMMUNITY_PROXY_SECRET to the same secret configured in Cloudflare; redeploy frontend.
5. Smoke-test /health, /feedback empty/list states, create -> pending -> admin approve -> public listing, input validation, abuse limit, mobile viewport.
6. Next cycles: remove unreliable legacy dependence via phased auth, squads, tournament and social data migrations; write data mapping and rollback strategy before touching production MongoDB data.
7. Next UI cycle: redesign tournament/player and squads views, add explicit service-unavailable states and accessibility audit. Preserve current routes for existing users.

## Continuation contract
At the start of each cycle inspect sport HEAD, current PR, CI, this file and latest user requests. Implement the next unfinished task in code; verify and record exact commit SHA, checks, blockers, and NEXT task. Do not claim live functionality until Cloudflare and Vercel configuration are verified. Do not merge untested changes just to trigger deployment.
