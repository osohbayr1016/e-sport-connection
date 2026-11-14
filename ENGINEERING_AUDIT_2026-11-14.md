# Engineering audit — 2026-11-14

## Scope
This review covers the current `sport` application, the GitHub `main` divergence, and PR #2 (Cloudflare D1 community features, cleanup, security and CI). It is **not** certification of the complete platform; game flows requiring live MongoDB, Socket.IO, payments, Revit-style hosted resources or production traffic still need end-to-end validation. Production deployment has not been requested.

## Verified defects and repairs in PR #2

| Severity | Finding | Resolution |
| --- | --- | --- |
| P0 | `main` historically committed `backend/.env`, backup env and a SQLite database | Files absent from `sport`/PR #2 tip. **Rotate exposed keys and consider history remediation.** |
| P0 | Public `/admin/clear-all` route could erase database after administrator authorization | PR #2 returns HTTP 410 (disabled). |
| P1 | Administrator user creation and password updates hash twice (route and model) | Model hashes once; ordinary user queries exclude hashes. |
| P1 | Authentication rate limiting was configuration with no effective per-route rules | Login and registration now have route-specific limits. |
| P1 | Tournament disqualification audit accepted a client-provided administrator ID | Attribution now uses the authenticated user. |
| P1 | Registration cancellation required a client-provided leader ID and decremented count before deleting | Authenticated ownership, atomic registration deletion, bounded count decrement; cancellation blocked after start. |
| P1 | Payment status update accepted any string | Whitelisted known states. |
| P1 | Frontend retried POST/DELETE mutations on 5xx or timeout | Retries only read-only GET/HEAD/OPTIONS requests. |
| P1 | Bounty history/balance endpoints were public, and GET created financial records | Authentication and owner/admin checks; read requests no longer create ledger records. |
| P1 | Cloudflare workflow could automatically deploy after push to `sport` | Deployment now requires an explicit manual confirmation input. |
| P2 | Linux backend clean/build script invoked PowerShell | Cross-platform Node cleanup in package scripts. |
| P2 | README documents old Next.js/Express stack | Updated top-level stack labels. |
| P2 | Repository tracked `node_modules` on prior branches | PR #2 removes checked-in dependencies and adds repository-hygiene CI. |

## Known remaining risks / implementation backlog

1. **Backend integration tests**: the existing Jest suites import `buildApp` from `src/index.ts`, but the module bootstraps the server on import and exports no factory; convert to a dependency-injected app factory and run Jest on CI.
2. **Money/coin consistency**: purchase and withdrawal decisions use multiple Mongoose saves, and financial transactions may be partially applied on failure or concurrent requests. Add MongoDB transactions, idempotency keys, an append-only ledger, unique operation IDs and reconciliation jobs.
3. **Tournament registration capacity**: both registration entrypoints check capacity and then increment in separate operations; concurrent joins can overbook. Reserve capacity atomically and reconcile on duplicate/failure.
4. **Cancel + refund lifecycle**: implement explicit payment reconciliation, refund rules and irreversible status transitions.
5. **Authorization coverage**: use route-level schemas, role guards, strict owner checks and record-scoped authorization consistently across all REST and Socket.IO mutations.
6. **Operational quality**: instrument error rates, rejected auth, queue delays, mail delivery, match result latency and Stripe-equivalent payment reconciliation (actual provider TBD); define backups, restore drills and alert thresholds.
7. **User experience**: reduce navigation complexity; offer tournament discovery filters, a joined-event dashboard, onboarding for organizers, responsive brackets, match readiness/check-in and useful error states.
8. **Tournament feature parity**: model bracket formats (single/double elimination, round-robin, Swiss), seeding, no-shows, score confirmation, disputes, schedule notifications, organizer roles and anti-cheat evidence.
9. **Security**: rotate all possibly leaked credentials; ensure code/dependency scanning, documented trusted proxy settings, login abuse controls, and enforce signed short-lived image/media uploads.
10. **Frontend quality**: replace silent demo-data fallbacks in live competitive/financial screens with explicit service-unavailable states; provide offline/retry UX without depicting synthetic data as live.

## Target architecture

- **Frontend:** Next.js App Router; typed API client; clear state ownership and accessibility.
- **Core API:** Fastify/Mongoose; versioned REST endpoints; centralized authentication/authorization; schema validation.
- **Realtime:** Socket.IO (presence, match state and messages); authenticated rooms and reconnect/replay behavior.
- **Tournament engine:** deterministic match/bracket state transitions; idempotent command processing; audited result/dispute events.
- **Community:** Cloudflare Worker + D1 for community feedback and tournament discovery where the existing worker already operates.
- **Finance:** immutable operation ledger + transactional balance projections, refund/reconciliation queue.
- **Observability:** correlation IDs, errors/latency metrics, structured audit logs and CI matrix.

## Competitor feature references

- Battlefy: check-in windows, participant management, result confirmation, disputes, Swiss and double-elimination support.
- Challonge: single/double elimination, round robin, Swiss, FFA formats and embed/API.
- start.gg: organizer workflow, mobile registration, bracket progression, notifications and detailed search.

## Validation and deployment policy

PR #2's automated checks run security/hygiene, Worker/D1 checks, backend TypeScript validation and frontend build/Jest. Additional backend integration tests, financial reconciliation tests, load tests and manual real-device QA remain necessary. Do not deploy to production without explicit release authorization.
