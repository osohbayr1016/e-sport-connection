# E-Sport Connection: third audit, verified fixes and backlog

**Date:** 2026-11-14. **Repository:** `osohbayr1016/e-sport-connection`. **Base:** `main` after PR #6. **Implementation:** PR #7. **Production deployments:** none.

## What this wave actually repairs

| Priority | Verified failure mode | Fix and regression checks |
|---|---|---|
| P0 | Tournament results saved before rewards, allowing completed matches with missing coins | `finalizeMatchWithRewards` now commits the match result and both squad wallet updates in one MongoDB transaction; test a missing-squad rollback, invalid result, and duplicate completion |
| P0 | Tournament create/update accepted server-owned lifecycle, bracket and count fields | Create allowlist and immutable defaults; update allowlist with conditional capacity guard, status lock and test |
| P0 | Tournament hard-delete left registered participants and matches orphaned | Transactional delete refuses nonempty or active tournaments |
| P1 | Socket.IO single-device map marked users offline when one tab closed, and messages missed other devices | `UserConnectionRegistry` tracks all sockets, detects last disconnect; Jest coverage |
| P1 | Stream chat and reactions could be emitted without joining their stream | Joined-room verification, typed and bounded content, reaction allowlist |
| P1 | Single-elimination advancement could drop odd winners, duplicate rounds on retries, or accidentally convert round-robin to elimination | Serialized per-tournament advancement, BYE creation, format-specific logic, admin retry endpoint and tests |
| P1 | Direct admin user-ledger adjustment ignored authoritative squad balance | Retired unsafe endpoint (HTTP 410) and disabled direct division-service coin minting |
| P1 | Admin could mark payout `PAID` without identifying any transfer | Required settlement-reference field in backend and UI; single-use state transition; integration checks |
| P1 | Public squad directory populated member and leader email addresses | Public-facing roster projections no longer return those fields |
| P1 | Double-elimination events could start despite lacking a working losers-bracket progression engine | Explicitly rejects start (409) pending full implementation rather than running a silently incomplete competition |

## Architectural direction

The **MongoDB transaction core** remains authoritative for accounts, team membership, tournament status, match results, and financial balances. Keep Cloudflare Worker/D1 as a separate **published community/discovery projection**, not another writer to the authoritative tournament. Synchronize via durable outbox events with unique keys and backfill/reconciliation to prevent Mongo/D1 drift.

Prefer the following internal domains:
1. **Identity:** centralized session policies, revocation, role/resource ACL, per-user and per-IP abuse protection.
2. **Competition:** deterministic tournament state transitions and per-format bracket engines, schedule/check-in/score dispute services.
3. **Wallet and payments:** immutable journal and wallet projection; bank-verified settlements and idempotent payouts; accounting reconciliation.
4. **Realtime:** authenticated and rate-limited Socket.IO rooms, per-stream ACL, Redis-backed multi-node presence.
5. **Operations:** admin audit trail, state repair queues, health/SLO alerts, backup restores and capacity testing.

## Competitor parity and nice-to-have features

| Product | Grounded capability | Recommended platform feature |
|---|---|---|
| [Challonge competition formats](https://kb.challonge.com/en/article/learn-about-challonge-competition-formats-1f8j1cf/) | Single/double elimination, round robin, Swiss, FFA and multi-stage | Proper reusable bracket engine with seeds, losers bracket, tie breakers, per-stage leaderboards |
| [Battlefy score confirmation](https://help.battlefy.com/en/articles/6966478-using-score-confirmation-on-battlefy) | Participant confirmation and automatically raised disputes | Dual-team score confirmation, timestamped evidence and appeal queue |
| [Battlefy activity feed](https://help.battlefy.com/en/articles/7874462-organizer-activity-feed-page) | Organizer action feed and check-in counts | Append-only admin timeline, check-in summary and CSV export |
| [start.gg updates](https://www.start.gg/updates) | Registration management, organizer tools, mobile and timezone improvements | Player dashboard, editable registration, localized schedule, organizer controls and notification delivery |

## Unfinished and important

- **External bank integration:** a reference typed by an admin does NOT prove settlement. Purchase/refund/payment receipts require signed bank/provider callbacks and independent reconciliation before using real money.
- **True ledger safety:** embedded `BountyCoin.transactions` remains mutable; migrate to an append-only `WalletOperation` with a unique idempotency key and projections.
- **Realtime multi-instance:** the new presence registry is process-local. Multiple backend nodes need Redis/Socket.IO adapter and distributed locks.
- **Bracket formats:** no complete losers-bracket, Swiss, two-stage group playoffs, FFA, seeding or BO3/BO5 map-based validation yet. Double-elimination starts are intentionally blocked.
- **Financial consistency:** wallet updates from non-tournament paths, retroactive match-score corrections, disputed payouts, and failed post-commit achievement updates need explicit reconciliation and background job handling.
- **Privacy:** migrate evidence and payment screenshots out of public URLs into private storage with signed expiring reads and retention controls.
- **Security and operations:** rotate secrets committed in earlier history; replace localStorage JWT with a revocable secure session approach; add route schema validation, audit logs, lock checks, resilient queues, restore exercises and load tests.
- **Tournament administration:** current register/check-in UI exists, but configurable check-in windows, no-show automation, roster locking, match-score appeals and staff roles are unfinished.
- **Branch configuration:** GitHub default branch is still `sport`, while requested engineering changes are merged into `main`. Review deploy and CI mappings before changing the default branch.

## Release gate

Run GitHub backend integration tests (MongoDB replica set), TypeScript checks, frontend build/tests, Worker tests, security checks and repository-hygiene checks on the final PR head. Passing these tests is necessary but not sufficient for real-money release: verify bank settlement, full end-to-end organizer UX, load, deployment rollback, audit logs, signed asset access and recovery.

**No production deployment should occur during this PR.**
