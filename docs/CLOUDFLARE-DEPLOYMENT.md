# Cloudflare Workers + D1 production launch checklist

Cloudflare accounts and Vercel projects must be connected or configured by an authorized owner. Committing code alone does not provision a Cloudflare Worker, D1 database, DNS domain or project secrets.

## One-time setup

1. In Cloudflare run: cd community-worker && npx wrangler d1 create e-sport-community
2. Record the actual D1 UUID and create Worker secrets: RATE_LIMIT_SALT, FEEDBACK_ADMIN_TOKEN, COMMUNITY_PROXY_SECRET (minimum 32 random characters). The proxy secret must match the Vercel server secret exactly.
3. In GitHub repository Settings > Secrets and variables > Actions, add the following.
   - Secret CLOUDFLARE_API_TOKEN: scoped token with Workers Scripts Edit and D1 Edit permissions
   - Secret CLOUDFLARE_ACCOUNT_ID: actual Cloudflare account ID
   - Variable CLOUDFLARE_D1_DATABASE_ID: actual UUID from step 1
   - Variable COMMUNITY_WORKER_URL: exact HTTPS Worker origin, without a trailing path
   - Variable COMMUNITY_WORKER_AUTODEPLOY: enabled (only after reviewing all settings)
4. Vercel server-only environment variables: COMMUNITY_API_ORIGIN = Worker origin, COMMUNITY_PROXY_SECRET = same Worker secret.
5. From GitHub Actions, manually start the Deploy Cloudflare Community API workflow. Verify migration, deploy, and health jobs complete. A subsequent push to sport automatically deploys when the opt-in variable is enabled.
6. Smoke test the real website /feedback: create suggestion -> pending -> admin approve -> publicly listed. Never declare the submission working without the live D1 and Vercel connection.

## Safety and troubleshooting

- Pull requests execute Worker tests, never production deploy. Production deployment happens only on sport branch or explicit workflow_dispatch and only when the opt-in variable equals enabled.
- The deploy job checks all GitHub settings, generates an uncommitted Wrangler config from its example and D1 UUID, runs D1 migration first and only then deploys.
- The GitHub Action checks GET /health after deployment; this endpoint now fails closed if required D1 tables or runtime secrets are missing.
- Deployments are serialized to avoid overlapping migrations.
- Do not store credentials or actual MongoDB connection strings in code, repository Variables, PR bodies or comments.
- Set up automated D1 backups and review migrations before changes.
- A missing Cloudflare account or Vercel environment means the new feedback service is not live. The frontend fails honestly with HTTP 503.
- The old Render Fastify/MongoDB backend needs separate rollout and must not be assumed to deploy from Vercel.
- Before inviting new players, rotate MongoDB/JWT secrets leaked in the repository history and verify existing admin accounts and current Render backend code.

See community-worker/README.md for Worker API endpoints and manual setup.
