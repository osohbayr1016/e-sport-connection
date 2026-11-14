# E-Sport Connection — second engineering audit and roadmap
Date: 2026-11-14. Reviewed target: `main` after PR #2, with implementation on PR #6.

## Verified issues addressed in PR #6

| Priority | Issue | Implementation |
| --- | --- | --- |
| P0 | Tournament match results, creation, bounty settings and deletion had unauthenticated mutation endpoints | All privileged tournament-match mutation routes require verified administrator. |
| P0 | Squad membership, invites, leader reassignment, creation and updates trusted a client-supplied userId | Authenticate 11 write endpoints, infer actor from verified token, whitelist editable fields and restrict invitation history to owner/leader. |
| P0 | Direct division coin purchases could mint credits without verified payment | Disabled unsafe direct purchase endpoint (410); use audited administrator approval flow. |
| P0 | Processing match bounty rewards used separate squad saves and could double-award | Transactionally apply both squad changes and mark match processed in one unit. |
| P1 | Concurrent tournament joins overbook and increment counts inconsistently | Shared MongoDB transactional service with conditional slot reservation + unique registration constraint; cancellation also transactional. |
| P1 | Financial approvals/refunds could be applied repeatedly or partially | Transactional withdrawal reservation/rejection, purchase decisions and conditional status transitions. |
| P1 | Importing backend `index.ts` started network/DB; backend Jest suites could not import `buildApp()` | Exported explicit Fastify factory, fail-fast route loading, real `app.inject()` integration tests and CI MongoDB replica set. |
| P1 | Socket invalid JWT was silently converted to anonymous user | Reject invalid token, verify associated account, block guest messaging and typing. |
| P1 | Tournament public registrations exposed player emails/payment metadata | Public page now returns only approved teams and safe participant names; finance details only to administrator/owner. |
| P1 | Tournament detail attempted registration without JWT, double-counted leader and used wrong game squad | Authenticated submission, pure eligibility checks, immediate actual errors and no fake delay. |
| P2 | There was no personalized registration or tournament check-in experience | Authenticated `/my-tournaments`, 24-hour authenticated leader check-in, duplicate-safe action. |
| P1 | Bracket route used a status absent from registration schema; generator admitted unapproved squads | Consistent approved/registered filtering, exclusion of banned squads and integration tests. |
| P1 | Odd participant counts created BYEs that violated the match model; round-robin/winners-bracket values were rejected | Match model now supports explicit BYEs and known bracket types; odd-sized bracket integration test. |
| P1 | Starting an event updated status before bracket generation | Tournament start and bracket insertion share a MongoDB transaction; failed generation rolls the start back. |
| P2 | Admin tournament creation used stale `maxParticipants` field and rejected zero-valued prize pools | `maxSquads` canonical with legacy alias and validated 2–256 capacity; zero prize pool accepted. |
| P2 | CI did not automatically validate commits merged to `main` | Full backend/security/worker/frontend checks on PR and `main` pushes, deployment is still manual-only. |
| P2 | Backend had redundant MongoDB index and nondeterministic build install | Removed redundant user index, changed build dependency install to `npm ci`. |

## Architecture moving forward

Keep `Fastify + MongoDB/Mongoose + Socket.IO` as the **authoritative transactional core** for accounts, squad membership, tournament registrations, brackets and coin ledger. Keep the **Cloudflare Worker + D1** as a distinct community feedback/discovery read model. Connect these services through an explicit outbox/import sync rather than treating both as writable sources of the same tournament, to avoid divergent participant counts.

### Module boundaries to establish
- **Identity & Access:** shared authentication, account lifecycle, session revocation, role and resource-ownership policy, rate limiting.
- **Tournament:** format-specific bracket generator, state machine, seat reservation, roster locking, attendance/check-in, seeded matches, dispute appeal.
- **Finance:** immutable append-only coin journal, wallet projection, payment receipt verification, two-person payout approval, signed webhook ingestion and reconciliation.
- **Messaging:** authenticated Socket.IO events, per-room ACL, multi-device presence and reconnect replay.
- **Community:** Worker D1 feedback, published discovery cards and cross-service sync health dashboard.
- **Operations:** migrations, secrets rotation, backups and restore tests, release checks, SLO metrics, structured audit events.

### Competing platforms and product gaps
- **Challonge** supports single/double elimination, round robin, Swiss, FFA, two-stage and leaderboard formats, plus public brackets: https://kb.challonge.com/en/article/learn-about-challonge-competition-formats-1f8j1cf/
- **start.gg** emphasizes accurate event times, visible seeds and Best-of-X, multi-user registration, admin roles and organizer tools: https://www.start.gg/updates/quality-of-life-updates
- **Battlefy** documents match check-in, score confirmation and bracket settings that become immutable after creation: https://help.battlefy.com/en/articles/9396943-bracket-settings-and-ordering

### Still open — honest release blockers

1. **Financial trust:** an administrator can mark coin purchases or payouts without a verified external bank receipt. Before real-money production, integrate signed provider callbacks, ledger-wide reconciliation, accounting/export and refund operations. The new MongoDB transaction guard addresses consistency, **not proof of payment**.
2. **Immutable ledger:** `BountyCoin.transactions` is still an embedded mutable array and certain old adjustment paths remain. Move to unique operation records with idempotency keys and a reconciliation job; avoid direct balance edits from every feature.
3. **Socket authorization:** beyond initial auth, audit every event (stream/viewer/message) for per-object ACL and rate limits; update single-socket map to support multi-device presence and graceful disconnect.
4. **Tournament formats:** BYE records and first-round variants are now schema-valid; complete bracket progression for double-elimination, round robin, Swiss, seeding, map veto, tiebreakers and Best-of-N/BO3 results still need implementation. Record each transition as an immutable event.
5. **Match completion:** results are recorded before the now-transactional reward distribution; a failed reward transaction can leave the match completed but uncredited. Add a durable outbox and retry/reconciliation worker.
6. **Payment proof privacy:** migrate proofs into private authenticated object storage with signed short-lived URLs rather than accepting arbitrary public image links.
7. **Account security:** move bearer tokens from localStorage to server-side revocable sessions with secure HttpOnly cookies; protect sensitive operations with CSRF/origin checks where appropriate, support password resets and recovery.
8. **Product consistency:** D1 community tournament cards and MongoDB tournaments currently use different data models and screens. Provide a single discovery experience with clearly linked registration workflows.
9. **CI/deployment:** replace old build/deploy scripts and deprecated dependencies after dependency compatibility checks; pin runtime, add SAST and package scanning. GitHub default branch is still `sport`; `main` is the merge target but defaults should be reconciled manually with deployment settings.
10. **Operations and UX:** validate with actual organizer and player sessions on desktop/mobile, run latency/load tests with realistic teams and network interruptions, monitor WebSocket reconnects, add support/admin queue and observability.

## Operational validation

Automated checks: Node `security/tests/*.test.mjs`; Worker/D1 API tests and migration validation; backend `tsc --noEmit`; backend Jest against ephemeral MongoDB replica set; Next.js build and Jest. Add integration scenarios for real financial provider callbacks and non-transactional failure recovery before claiming production-ready. **Do not deploy to production from this PR**. Cloudflare Worker deployment requires explicit manual `workflow_dispatch` confirmation.
