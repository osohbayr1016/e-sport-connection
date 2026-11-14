# E-Sport Connection — Fourth Engineering Audit

Date: 2026-11-14. Base: merged PR #7 on main. Branch/PR: fourth audit #8. No production deployment.

## Verified defects and fixes

| Priority | Bug | Repair |
|---|---|---|
| P0 | Direct messages could reference another conversation and expose private preview text | Shared conversation reference validation in Socket.IO + REST; sanitizes legacy persisted cross-chat replies |
| P1 | Logout did not invalidate JWTs | User tokenVersion bump, verified during HTTP auth and Socket.IO connection and protected events; login and refresh carry version |
| P1 | Squad joins were non-atomic read-then-save, enabling overbooking | Atomic conditional $addToSet with an array-size predicate and join-policy / leader constraints |
| P1 | Invitation acceptance and application approval saved roster and request separately | Both changes now commit in one MongoDB transaction, preserving status if full or stale |
| P1 | Paid tournament approval silently marked registration paid without bank evidence | Payment recording separated from competition approval, requires manually verified bank reference, unique reference index, idempotent admin state changes |
| P1 | Rejected paid-tournament entries permanently consumed participant slots | Transactionally release slot once for unpaid rejected registrations; paid entries need explicit refunds instead |
| P1 | Admin tournament registration frontend did not forward bearer authentication | Explicit Authorization header in API fetches and Next server proxies, bank reference recording UI, approve disabled until paid |
| P1 | Auth integration suite shared a 5-per-15-minute rate limit bucket across unrelated tests | Isolate Fastify app instance per test while keeping production auth throttling active |

## Architecture and roadmap

1. **Money:** Manual reference entry is not actual bank verification. Before using money, integrate signed payment-provider/bank callbacks and an immutable operation journal keyed by provider transaction IDs. Define refund and chargeback state machines, reconciliation exports and access-controlled payment evidence.
2. **Teams:** Move all roster changes through a single transactional service, integrate leader handovers and roster locks on check-in, and add unique cross-squad membership policy if the game requires it.
3. **Sessions:** An account-level tokenVersion revokes all sessions, not a single device. Migrate to independently revocable server-side sessions with HttpOnly cookies and CSRF safeguards. Socket revocation checks currently add a DB read per protected event; adopt distributed session-cache invalidation + Redis adapter for scale.
4. **Competition:** The bracket engine still lacks a complete double-elimination losers bracket, Swiss pairing, seeding, best-of map veto, disputes and score confirmation. Existing unsupported formats fail closed rather than produce a wrong bracket.
5. **Realtime:** Socket presence is process-local, and active viewer accounting needs crash recovery and stale session TTL; add Redis adapter and verified public/organizer stream ACLs.
6. **Reliability:** Introduce admin audit events, per-request idempotency keys, a transactional outbox for post-commit achievements, state reconciliation and backup-restore exercises.
7. **UX:** Add organizer review dashboard with labeled *unverified / manually verified / approved / refunded* payment states and localized Mongolian explanations. Existing admin review adds the necessary bank reference input and feedback but needs a production usability study.

## Competitor reference points

- Challonge: competition formats (single/double elimination, round-robin, Swiss)
- Battlefy: participant check-in, score confirmation, appeal/dispute workflows
- start.gg: organizer registrations, seeding, event settings and schedules

## Delivery gate

Run backend Jest on MongoDB ephemeral replica set, TypeScript, frontend build/tests, Worker tests, security and repository hygiene checks. No production deployment. Do not claim real-money readiness until signed settlement verification, immutable ledger and reconciliation are complete.

Default GitHub branch is still sport; requested integration branch is main. Changing default branch should be coordinated with CI and deployment mappings.
