# RUNBOOK

Operations for this product. Fill the bracketed slots when you go live.

## Deploy

- Push to `main`. `.github/workflows/migrate.yml` runs `make db-migrate` over `DATABASE_DIRECT_URL`, then Vercel deploys.
- Preview per pull request. `.github/workflows/preview-checks.yml` runs `make e2e`, `make crawl`, `make a11y`, `make lighthouse` and `make static-routes` against the preview URL.
- Docker exit: `docker compose -f docker-compose.prod.yml up --build` serves the standalone build with its own Postgres. No app code changes.

## Endpoints

| Environment | App                     | Database              | Webhook secret    |
| ----------- | ----------------------- | --------------------- | ----------------- |
| Local       | <http://localhost:3000> | Compose Postgres      | `whsec_test_...`  |
| Preview     | Branch URL from the PR  | Shared preview DB     | Preview secret    |
| Production  | [canonical URL]         | Supabase, `sg` region | Production secret |

Health: `GET /api/health` returns `{ "ok": true }` and an `x-request-id` header. Better Stack probes it every minute.

Cron routes (all need `Authorization: Bearer $CRON_SECRET`):

| Route                    | Schedule | What it does                           |
| ------------------------ | -------- | -------------------------------------- |
| `/api/cron/budget-check` | Daily    | Emails the owner at 80% and 100% spend |
| `/api/cron/digest`       | Weekly   | Emails the weekly digest               |

Webhooks: `POST /api/webhooks/stripe` verifies the Stripe signature on the raw body and dedupes by event id in `webhook_events`. Test locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Where to look

| Signal        | Home                                                   |
| ------------- | ------------------------------------------------------ |
| App logs      | Vercel logs, or `docker compose logs app` on self-host |
| Request trail | JSON lines with `requestId`; error responses return it |
| Errors        | Sentry project [name], source maps uploaded at build   |
| Database      | Supabase logs, or `docker compose logs postgres`       |
| Webhooks      | Stripe dashboard, then the `webhook_events` table      |
| Email         | Resend dashboard                                       |
| Analytics     | PostHog dashboard from the EXPERIENCE brief metrics    |
| Uptime        | Better Stack                                           |

## Rollback

- App: Vercel instant rollback to the previous deployment, or redeploy the previous image on self-host.
- Database: forward-fix only. Never roll a migration back; write a new one.
- Risky features ship behind a kill-switch env flag, default off.

## Restore

1. Find the latest dump in the backup bucket (weekly `pg_dump`, custom format).
2. Run `BACKUP_FILE=./latest.dump make restore-drill`. It restores into a scratch database, counts `notes` and `webhook_events`, and drops it.
3. To restore for real, point the drill's `pg_restore` line at a fresh database, verify counts, then swap `DATABASE_URL`.
4. Drill quarterly and before launch; record the date below.

Last drill: [date, by whom, result].

## Rotate secrets

1. Create the new value at the provider (`CRON_SECRET`, `STRIPE_WEBHOOK_SECRET`, Resend, PostHog).
2. Set it in Vercel (production, then preview) or the compose env file.
3. Redeploy. Confirm `/api/health` and one cron route with the new secret.
4. Delete the old value. If the Vercel protection-bypass secret leaked, rotate it too.

## Incident

1. Confirm scope from Better Stack and Sentry. Note the `requestId`s.
2. Mitigate: rollback, kill-switch, or scale the database.
3. Fix forward on `main` with a regression test.
4. Write the timeline here within a day: what broke, what fixed it, what stops it next time.

## Breach

Follow the PDPC assessment and notification rules current at the time (and the GDPR 72-hour rule when EU users exist): contain, assess whose data left, notify the authority and the users inside the deadline, keep the evidence. The data map lives in the EXPERIENCE brief.

## Launch checklist

- [ ] `TEMPLATE-TODO` and `TEMPLATE-BRAND` lists are empty (`make template-debt`, `make brand-check`).
- [ ] `make check`, `make licenses`, `make security` green; CodeQL green.
- [ ] Blank-DB migration ran in CI; `make restore-drill` passed this quarter.
- [ ] Custom domain on HTTPS with the apex 301; `site.url` matches.
- [ ] Google Search Console and Bing Webmaster verified; sitemap submitted.
- [ ] SPF, DKIM and DMARC from Resend; mail sends from a subdomain.
- [ ] PostHog dashboard built; taxonomy events arrive from a seeded run.
- [ ] Budget rows set per provider; digest cron verified.
- [ ] Sentry DSN set; `.map` files return 404.
- [ ] Better Stack probes `/api/health`.

## OAuth launch checklist (Google)

- [ ] Homepage and `/privacy` on the same Search Console-verified domain.
- [ ] `/privacy` linked from the homepage and disclosing Google user data use.
- [ ] Every linked domain authorized in the OAuth client; no redirects or short links.
- [ ] Brand verification submitted before launch.

Apple, Facebook, X and the stores reuse the same URLs.

## Spend

| Item      | Cap                                          |
| --------- | -------------------------------------------- |
| Vercel    | Spend management on; preview bot guard on    |
| Database  | Tier [name]; pooler limit checked            |
| AI        | Cheapest passing model; `budget` rows cap    |
| Email/SMS | Per-IP and per-recipient caps; daily SMS cap |

## Load

Golden path at 10x expected peak against preview with autocannon or k6. Record the result: [date, p95 reads, verdict].
