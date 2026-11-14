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

## Security finding: public administrator privilege escalation
- Former public registration accepted ADMIN and unauthenticated PUT /api/users/update-role could grant ADMIN to any email.
- Closed both attack paths in this branch: registration now rejects ADMIN and public /update-role route is deleted. Removed the public /admin-setup helper page; admin UI link now uses role only.
- Check historical logs and list existing ADMIN users for unauthorized roles before reactivation. Rotate JWT_SECRET to invalidate suspect sessions and implement password reset/notification if compromise is found.
- Backend fix is NOT live until the updated backend actually deploys; fixing the Vercel frontend alone cannot protect the old Render backend.

## Cycle 2: testing and safety
- CI baseline: Worker tests passed; frontend Next.js build passed; frontend Jest failed on misnamed sample suite, obsolete unsupported division levels, and duplicate-notifications test.
- Fix Jest alias typo, replace misnamed sample suite with actual DivisionService test and move example to .examples.ts, align DivisionCoinImage test cases with actual SILVER/GOLD/DIAMOND enums.
- Prevent same-tick duplicate mark-all PATCH submissions using a synchronous ref guard and correct test to distinguish background fetches from PATCH calls.
- Disable highly destructive clear-all operations in both Fastify and Next.js, returning HTTP 410. Retain authenticated admin user management for ordinary maintenance.
- Prior commit in this PR removed unauthenticated /api/users/update-role; independently verify the live legacy Render backend is redeployed or block it there as well.

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

## Cycle 3: UX reliability
- Players: remove duplicate global navigation; 8s fetch timeout, reject unrelated game profiles, ensure only real IDs shown, sort a copy and distinguish service downtime from real empty results.
- Tournaments: surface backend failures rather than saying none exist; truthful empty state with link to community feedback.
- New shared ServiceState for consistent accessible empty/offline messaging; remove dead social/footer links; expand UI CI path triggers.
- Do not claim production deployment until account bindings and smoke tests are verified.

## Cycle 4: readiness verification
- Worker /health now checks that DB schema can be queried AND required shared-secret/protection configuration is present (fail-closed, no secret details leaked). Added Node regression tests for 200/503 and missing migration.
- If /health is 503, do not enable public submission; complete Cloudflare + Vercel bindings and verify the full moderated lifecycle first.


## Cycle 5: reconciled production security hotfixes and Cloudflare delivery (2026-10-18)
- **Default sport security PR #3** merged: registration can no longer create ADMIN, public role promotion and admin setup removed. Sport commit ea7c99200c0268efd4fcd4b78f636dc64520dd73; CI green.
- **Default sport security PR #4** merged: removed checked-in .env/backup/dev DB, replaced embedded live MongoDB URI with Render sync:false, sanitized deployment guides and added credential regression tests. Sport commit 053fe70f477e94628b199a623fdeb167dd7b68df; CI green.
- **Default sport security PR #5** merged: authenticated admin role required for coin transaction mutations, administrative tournament CRUD/start/disqualify, achievement administration, and registration payment/approval; authenticated squad leadership required for registration/cancellation; direct paid auto-approval disabled. Sport commit 0852ae7ea4a84924528aeb27a6ac4fb72aca5820; CI green.
- Security hotfixes were merged into the feature branch history with two-parent merge commits, preserving the Cloudflare worker/new UI changes while avoiding overwriting security fixes. PR #2 remains DRAFT, not deployed.
- Production Cloudflare GitHub Action added: .github/workflows/deploy-community-worker.yml; PR tests run. Auto deploy must be explicitly opted in via repository Actions variable COMMUNITY_WORKER_AUTODEPLOY=enabled; the real account token, account ID, D1 UUID, Worker URL and runtime secrets are still required. Read docs/CLOUDFLARE-DEPLOYMENT.md.
- Scheduled cycle simultaneously added D1 tournament read API, 0002 migration, import script, status-aware UI, community contribution GitHub issue templates. These are on PR #2, NOT live. Read docs/CYCLE3-TOURNAMENTS.md plus community-worker/MIGRATION.md and TOURNAMENTS.md before modifying.
- After merge reconciliation at feature commit 6e13a18283a1899eceb5ac2ce168c9f059d91267: Admin role regression and backend typecheck passed, Worker checks passed, Cloudflare deploy job intentionally skipped (not configured), frontend CI was running. Always re-query the LATEST HEAD/CI in the next cycle and do not assume this SHA stays current.
- Vercel homepage cannot currently be verified from this tool session (external fetch cache miss). No Cloudflare API resource nor Vercel secret environment changes were performed. Do not claim verified production.

### NEXT bounded engineering cycle (prioritized)
1. Check the latest HEAD of sport and feat/community-feedback-worker-d1, PR #2, newest GitHub Actions run and failures; update this checkpoint with exact SHA/CI facts.
2. Fix any remaining TypeScript/Jest/Worker CI failures, including static route guard regressions; preserve existing security hotfixes. Never clobber concurrent cycle commits: use update_ref expected_sha.
3. Review new D1 tournament migration + import script for idempotence, validation, bad payloads, data-loss risk and rollback; do not run against production data until a backup and verified data mapping exist.
4. Implement a real moderator UI with server-side session authorization (never expose FEEDBACK_ADMIN_TOKEN to browsers), and add safe feedback status transitions, dedup, anti-abuse and accessibility tests.
5. Identify and repair other unguarded legacy mutations (match scoring, squads, news, rewards) via isolated security PRs with backend typecheck before merge. Do not silently disable end-user registration; test authorized flows.
6. User-controlled account work: rotate historical leaked Atlas/JWT/OAuth keys and audit ADMIN users/coin and payment records, connect Render to verify backend deployed, configure Cloudflare D1/Worker and Vercel server secrets; absent account connection, remain in draft and use honest 503 fallback.

**Boundaries:** The hourly reminder resumes work but is not an uninterruptible 55-minute compute process; record concrete implementation in each cycle. Stop scheduling after the 08:00 Asia/Ulaanbaatar cycle as requested.
