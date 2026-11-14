# Legacy tournament migration

The importer reads an offline MongoDB JSON export and generates D1 SQL. It does not connect to MongoDB, need database credentials, or publish events.

1. Back up the old database and export the tournaments collection as a private JSON array.
2. Apply D1 migrations 0001 and 0002 to a staging database.
3. From community-worker, run: node scripts/import-legacy-tournaments.mjs /private/tournaments.json imports/tournaments.sql
4. Inspect the imported/skipped counts and review the generated SQL.
5. Run Wrangler D1 execute with the generated SQL against staging first, then production only after verification and a backup.
6. Publish verified events separately through an authenticated administration workflow.

Mapping: old Mongo ID becomes a deterministic UUID; name -> title, startDate -> starts_at, registrationDeadline -> registration_closes_at, maxSquads -> max_teams, prizePool -> prize_pool_mnt, location -> venue. Legacy registration_closed maps to upcoming but remains unpublished and is counted for manual review.

Safety: all imported records are published=0, registration_url is empty, unsupported data is skipped, SQL strings are hex-encoded, imports are idempotent, and existing output files cannot be overwritten. No user accounts, team membership, payments, or historical registrations are imported. Never commit exports or generated SQL files.
