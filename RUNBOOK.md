# RUNBOOK

Operations for this product. Fill the bracketed slots when you go live.

## Deploy

- Push to `main`. `.github/workflows/migrate.yml` runs `make db-migrate` over `DATABASE_DIRECT_URL`, then Vercel deploys.
- Preview per pull request. `.github/workflows/preview-checks.yml` runs `make e2e`, `make crawl`, `make a11y`, `make lighthouse`, and `make static-routes` against the preview URL.
- Docker exit: `docker compose -f docker-compose.prod.yml up --build` serves the standalone build with its own Postgres. `TRUST_IDENTITY_HEADER` is forced off in production.
- TEMPLATE-TODO(deploy): set your target Vercel region in `vercel.json` (defaults to `sin1`).

## Endpoints

| Environment | App                     | Database           | Webhook secret    |
| ----------- | ----------------------- | ------------------ | ----------------- |
| Local       | <http://localhost:3000> | Compose Postgres   | `whsec_test_...`  |
| Preview     | Branch URL from the PR  | Shared preview DB  | Preview secret    |
| Production  | [canonical URL]         | Managed PostgreSQL | Production secret |

- **Health:** `GET /api/health` pings Postgres and returns `{ "ok": true }` with an `x-request-id` header. Point Better Stack or another uptime pinger here.
- **Webhooks:** `POST /api/webhooks/payments/[provider]` (and `POST /api/webhooks/stripe`) verifies raw-body HMAC signatures via `src/server/payments/`, enforces replay tolerance, and deduplicates `(provider, eventId)` in `webhook_events`. Test locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Where to look

| Signal        | Home                                                                  |
| ------------- | --------------------------------------------------------------------- |
| App logs      | Vercel runtime logs, or `docker compose logs app` on self-host        |
| Request trail | JSON lines with `requestId` (`x-request-id` header & error responses) |
| Errors        | `src/instrumentation.ts` logs + Sentry project when `SENTRY_DSN` set  |
| Database      | Supabase/managed Postgres logs, or `docker compose logs postgres`     |
| Webhooks      | Gateway dashboard + `webhook_events` table                            |
| Email         | Resend dashboard                                                      |
| Analytics     | PostHog project (server events + optional replay/heatmaps/flags)      |
| Uptime        | Better Stack `/api/health` monitor                                    |

## Rollback

- **App:** Instant rollback on Vercel to the previous deployment, or redeploy the prior container image on self-host.
- **Database:** Forward-fix only. Never edit or roll back an applied migration; generate a new forward migration with `make db-generate`.
- **Feature kill-switches:** Gate risky features behind feature flags (`getFeatureFlag` / `useFeatureFlag`) or environment flags defaulting to off.

## Restore

1. Download the latest custom-format `pg_dump` from backups.
2. Run `BACKUP_FILE=./latest.dump make restore-drill`. It restores into a scratch database, verifies counts in `feedback` and `webhook_events`, and drops the scratch database.
3. For a real restore, target a fresh database, verify row counts, then swap `DATABASE_URL` / `DATABASE_DIRECT_URL`.
4. Test restores quarterly and before launch.

Last drill: [date, by whom, result].

## Rotate secrets

1. Generate the new secret at the provider (`CRON_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `POSTHOG_API_KEY`, `SENTRY_DSN`).
2. Add the new value to Vercel (production, then preview) or your container env file. Stripe webhooks support multiple active `v1` signatures during rotation.
3. Redeploy and confirm `/api/health` and a test webhook succeed.
4. Revoke the old value at the provider.

## Incident

1. Check uptime monitor, Sentry issues, and logs filtering by `requestId` / `error.digest`.
2. Mitigate: roll back deployment, toggle feature flag, or scale database pooler.
3. Ship a forward fix on `main` with a regression test.
4. Record the incident summary within 24 hours.

## Launch checklist

- [ ] `TEMPLATE-TODO` and `TEMPLATE-BRAND` markers resolved (`make template-debt`, `make brand-check`).
- [ ] Real authentication wired in `src/server/auth/index.ts` and `TRUST_IDENTITY_HEADER` confirmed `false`.
- [ ] `make check`, `make licenses`, and `make security` green; CodeQL green.
- [ ] Clean-DB migration verified (`make db-migrate && make db-check`); `make restore-drill` tested.
- [ ] Custom domain on HTTPS with canonical `site.url` set in `src/shared/config/site.ts`.
- [ ] Search Console / Bing verified and `/sitemap.xml` submitted.
- [ ] SPF, DKIM, and DMARC configured for `EMAIL_FROM` domain.
- [ ] `SENTRY_DSN` configured and verified; `/api/health` monitored by uptime pinger.
- [ ] PostHog key configured if tracking analytics, replays, or A/B experiments.

## OAuth launch checklist (Google)

- [ ] Homepage and `/privacy` hosted on the same verified domain.
- [ ] `/privacy` linked from the footer and accurately discloses user data handling.
- [ ] Every redirect URI authorized in the OAuth client; brand verification submitted before launch.

## Spend & Load

| Item       | Guardrail                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| Vercel     | Spend management cap enabled; deployment protection on preview URLs       |
| Database   | `DATABASE_URL` uses transaction pooler (`prepare: false`) in prod         |
| Public API | Rate-limiting enabled on public routes via `src/server/api/rate-limit.ts` |

Benchmark the primary read/write paths at 10x expected peak against a staging/preview environment before launch: [date, p95 latency, verdict].
