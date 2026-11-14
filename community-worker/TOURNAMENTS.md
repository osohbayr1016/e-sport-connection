# Community tournament catalog

Cloudflare D1 migration 0002 creates the tournament catalog. No fake events are seeded. The frontend shows only published records, with a real empty or service-unavailable state otherwise.

Public endpoints:
- GET /api/tournaments?limit=20: published events only, maximum 50.
- GET /api/tournaments/<uuid>: published event details.

Administrator endpoints (protected by the existing Worker administrator credential):
- POST /api/tournaments: create an event. Required JSON fields: title, description, format, venue, organizer, game, status, starts_at (UTC ISO 8601), registration_closes_at (nullable), max_teams, prize_pool_mnt, registration_url (HTTPS or empty), published (boolean).
- POST /api/tournaments/<uuid>/status: change status and published flag.

Statuses: upcoming, registration_open, ongoing, completed, cancelled. New events should normally be created unpublished until checked. External registration links must be verified. This catalog does not accept payments or register teams. Those actions require a separate authenticated workflow.

Scheduled maintenance runs daily at UTC midnight and removes pseudonymous rate-limit records older than seven days. Copy the cron trigger from wrangler.toml.example into the deployed Wrangler configuration.

For a safe offline import of old MongoDB tournament metadata, see MIGRATION.md. Do not import historical payment data or automatically mark old registrations as paid.
