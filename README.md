# template-fullstack-t3

[![CI](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/ci.yml/badge.svg)](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/ci.yml)
[![CodeQL](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/codeql.yml/badge.svg)](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A production-ready, agent-friendly fullstack Next.js template built on the T3 stack: Next.js 16 (App Router), tRPC 11, Drizzle ORM on PostgreSQL/Supabase, Tailwind CSS 4, and shadcn/ui. Built with strict security boundaries, observability, provider-agnostic payments, and automated engineering gates from day one.

## Quick start

Install these prerequisites first:

- [Bun](https://bun.sh) and Node.js 22.12 or later.
- [Docker](https://docs.docker.com/get-docker/) for local PostgreSQL (or point `DATABASE_URL` at Supabase/Neon).
- GNU make. On Windows run `winget install ezwinports.make`; on macOS run `xcode-select --install`. Restart your terminal afterwards.

Then run:

```bash
gh repo create my-app --template tanzhongyan-org/template-fullstack-t3 --private --clone
cd my-app
make setup
bun run dev:setup
make doctor
make dev
```

`make setup` installs dependencies and git hooks. `bun run dev:setup` copies `.env.example` to `.env`, starts PostgreSQL, and runs migrations. `make doctor` checks your environment, database reachability, and migration state. `make dev` serves <http://localhost:3000>.

> [!NOTE]
> `TRUST_IDENTITY_HEADER` defaults to `"false"` (fail-closed) in `.env.example`. To try `/examples` and the in-app feedback dialog during `make dev`, add `TRUST_IDENTITY_HEADER="true"` to .env.development.local (Next.js reads it in dev only, never during `next build`). Replace `src/server/auth/index.ts` before launch (see [auth recipes](docs/recipes/auth-providers.md)).

## What you get

- **Typed fullstack core:** Next.js 16 App Router, React 19, TypeScript strict mode, tRPC 11 with timing/error logging, and Zod input validation.
- **Database & Supabase readiness:** Drizzle ORM, SQL migrations in `drizzle/`, `DATABASE_DIRECT_URL` migration support, automatic transaction-pooler detection (`prepare: false` on port `6543`), and `make db-check` drift enforcement.
- **Security & RBAC boundary:** Isolated `src/server/auth/index.ts` (`getServerSession`, `protectedProcedure`, `adminProcedure`), sliding-window `src/server/api/rate-limit.ts`, fail-closed production env guards, `parseJsonBody`/`readRawBody` body-size caps, security headers, and constant-time cron auth in `src/server/cron.ts`.
- **Global payment interface:** Provider-agnostic `PaymentProvider` contract and webhook idempotency engine in `src/server/payments/` with hardened Stripe support (`5m` replay window, multi-`v1` secret rotation) and `/api/webhooks/payments/[provider]`.
- **Observability & growth (dormant until keys are set):**
  - `src/instrumentation.ts` (`onRequestError`), structured JSON logs with `x-request-id`, and optional zero-dep Sentry reporting via `SENTRY_DSN`.
  - Tamper-proof server analytics (`trackServer`, `getFeatureFlag`), client-safe `/api/analytics`, and opt-in `<AnalyticsProvider />` for privacy-masked PostHog Session Replay, Heatmaps, and A/B flags.
  - Built-in accessible `<FeedbackDialog />` in `src/features/feedback/` backed by tenant-isolated Postgres storage.
- **UI & component review:** Tailwind CSS 4, shadcn/ui primitives (`src/shared/components/ui/`), brand tokens in `packages/shared/tokens.ts` with WCAG 2.2 AA `make contrast`, and Storybook (`.storybook/`) + Playwright smoke/crawl/axe checks (`e2e/`).
- **Automated engineering gates:** `make verify` (fast hook gate with unit tests) and `make check` (full CI suite: typecheck, Biome, markdownlint, Vitest + coverage, production build, knip, fallow dupes, ast-grep boundaries, repo policy, tokens, contrast, brand check, migration drift).

## After creating your repo

1. Run `make doctor` to verify runtime tools, `.env`, DB reachability, and migration state.
2. Run `make template-debt` to view every `TEMPLATE-TODO` marker you need to resolve.
3. Run `make brand-check` to inspect `TEMPLATE-BRAND` slots (name, URLs, legal copy, colors).
4. Once you scaffold your own features with `make new-feature name=<kebab-case>`, run `make clean-examples` followed by `make db-generate` to strip the starter `_example` slice.
5. Check `docs/recipes/` (including [mobile-tokens](docs/recipes/mobile-tokens.md)) to plug in Better Auth / Supabase Auth, additional global payment providers, AI metering/evals/crons, Uniwind tokens, or a pre-launch waitlist (and scaffold `notes` or other domain slices via `make new-feature`). Need to skip Storybook or payments on a project? Remove `.storybook/` + `src/**/*.stories.tsx` or `src/server/payments/` + `src/app/api/webhooks/` cleanly.

## Configuration

Copy `.env.example` to `.env`. **The environment schema lives at [`src/shared/config/env.js`](src/shared/config/env.js)** (rather than root src/env.js) right alongside site.ts and security-headers.js.

| Variable                       | Required | Default  | Description                                                                               |
| ------------------------------ | -------- | -------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | Yes      | none     | PostgreSQL connection string (supports pooled port `6543` / `pgbouncer=true`)             |
| `DATABASE_DIRECT_URL`          | No       | none     | Direct (non-pooled) URL for Drizzle migrations; falls back to `DATABASE_URL`              |
| `DB_PREPARE_STATEMENTS`        | No       | auto     | Override prepared statements (defaults to `false` for transaction poolers)                |
| `DB_MAX_CONNECTIONS`           | No       | `10`/`5` | Max PostgreSQL pool connections (`10` in prod, `5` in dev)                                |
| `TRUST_IDENTITY_HEADER`        | No       | `false`  | Honour `x-user-id` in local dev/tests. Boot fails if enabled in `production` or `preview` |
| `ADMIN_USER_IDS`               | No       | none     | Comma-separated user IDs granted `admin` role in `src/server/auth/index.ts`               |
| `POSTGRES_PORT`                | No       | `5432`   | Host port for the local PostgreSQL Docker container                                       |
| `RESEND_API_KEY`               | No       | none     | Resend API key for email. Unset prints to console in local dev only                       |
| `EMAIL_FROM`                   | No       | none     | Sender address. Required when `RESEND_API_KEY` is set                                     |
| `POSTHOG_API_KEY`              | No       | none     | Server PostHog key for tamper-proof `trackServer` & `getFeatureFlag`                      |
| `POSTHOG_HOST`                 | No       | US cloud | PostHog API host (`https://us.i.posthog.com` or `https://eu.i.posthog.com`)               |
| `NEXT_PUBLIC_POSTHOG_KEY`      | No       | none     | Client PostHog key enabling `<AnalyticsProvider />` (dormant when unset)                  |
| `NEXT_PUBLIC_POSTHOG_HOST`     | No       | US cloud | Client PostHog host                                                                       |
| `NEXT_PUBLIC_POSTHOG_REPLAY`   | No       | `false`  | Enable privacy-masked PostHog session replay when `NEXT_PUBLIC_POSTHOG_KEY` is set        |
| `NEXT_PUBLIC_POSTHOG_HEATMAPS` | No       | `false`  | Enable PostHog click heatmaps when `NEXT_PUBLIC_POSTHOG_KEY` is set                       |
| `SENTRY_DSN`                   | No       | none     | Optional Sentry DSN for server error reporting in `src/instrumentation.ts` and tRPC       |
| `CRON_SECRET`                  | No       | none     | Bearer secret for `cronAuthorized` in `src/server/cron.ts` (constant-time comparison)     |
| `PAYMENT_PROVIDER`             | No       | `stripe` | Active gateway adapter key in `src/server/payments/index.ts`                              |
| `STRIPE_WEBHOOK_SECRET`        | No       | none     | Stripe webhook signing secret. Unset returns `503` on webhook routes                      |

Set `AGENT_HOOK_SKIP=1` to skip the agent stop hook (`make verify` when an agent finishes).

## Commands

| Command               | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `make setup`          | Install dependencies and git hooks                                         |
| `make doctor`         | Check Node, Bun, `.env`, Postgres reachability, and migration status       |
| `make dev`            | Start the dev server                                                       |
| `make verify`         | Fast gate (no DB, no build): typecheck, lint, unit tests, policy, db-check |
| `make check`          | Full CI gate suite; requires `DATABASE_URL` and migrated Postgres          |
| `make test`           | Run all Vitest unit + `.db.test.ts` suites with coverage                   |
| `make test-unit`      | Run fast unit tests only (no DB required)                                  |
| `make lint`           | Biome and markdownlint                                                     |
| `make fix`            | Apply Biome auto-fixes                                                     |
| `make typecheck`      | Run `tsc --noEmit`                                                         |
| `make build`          | Production Next.js build                                                   |
| `make knip`           | Dead code check                                                            |
| `make dupes`          | Duplicate code check                                                       |
| `make anti-slop`      | ast-grep boundary rules and their tests                                    |
| `make policy`         | Layout, docs, dependency ledger, and version drift checks                  |
| `make audit`          | Dependency vulnerability audit                                             |
| `make template-debt`  | List `TEMPLATE-TODO` markers                                               |
| `make tokens`         | Generate CSS variables from `packages/shared/tokens.ts`                    |
| `make contrast`       | Fail token pairs below WCAG 2.2 AA                                         |
| `make brand-check`    | Verify brand wiring and list `TEMPLATE-BRAND` slots                        |
| `make licenses`       | License gate; generates `NOTICE`                                           |
| `make security`       | Audit, pin hygiene, and 14-day new-dependency age check                    |
| `make restore-drill`  | Restore `BACKUP_FILE` into a scratch database                              |
| `make seed`           | Seed deterministic demo data for two tenants                               |
| `make new-feature`    | Scaffold `src/features/<name>` from `src/features/_example/`               |
| `make clean-examples` | Remove the starter `_example` slice, route, and table                      |
| `make stories`        | Start Storybook                                                            |
| `make stories-build`  | Build static Storybook bundle                                              |
| `make e2e`            | Playwright smoke tests against `PREVIEW_URL` or local server               |
| `make crawl`          | Sitemap crawler checking for console/page errors                           |
| `make a11y`           | Playwright axe accessibility checks at 375px and 1280px                    |
| `make lighthouse`     | Lighthouse performance and a11y budgets                                    |
| `make static-routes`  | Verify public marketing/legal routes prerender                             |
| `make db-generate`    | Generate a SQL migration from `src/server/db/schema.ts`                    |
| `make db-migrate`     | Apply SQL migrations in `drizzle/`                                         |
| `make db-check`       | Verify `drizzle/` matches `src/server/db/schema.ts` with zero drift        |
| `make db-push`        | Sync schema directly without a migration file (local scratch only)         |

## Project layout

| Path                     | Holds                                                       |
| ------------------------ | ----------------------------------------------------------- |
| `src/app/`               | Next.js App Router pages, layouts, and API route handlers   |
| `src/features/`          | Feature slices (`_example`, `feedback`, and your domains)   |
| `src/server/`            | Auth, tRPC, Drizzle DB, payments, rate limit, logs, metrics |
| `src/shared/`            | Env config, site brand, UI primitives, `AnalyticsProvider`  |
| `src/instrumentation.ts` | Next.js server boot & `onRequestError` observability hook   |
| `packages/shared/`       | Brand color tokens and client/server analytics taxonomy     |
| `drizzle/`               | Generated SQL migrations and snapshots                      |
| `e2e/`                   | Playwright smoke, crawler, and axe specs                    |
| `.storybook/`            | Storybook configuration and mock tRPC/theme providers       |
| `docs/`                  | ADRs, dependency ledger, and copy-paste integration recipes |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the code map and [RUNBOOK.md](RUNBOOK.md) for operations.

## More

[CONTRIBUTING.md](.github/CONTRIBUTING.md) | [SECURITY.md](.github/SECURITY.md) | [LICENSE](LICENSE)
