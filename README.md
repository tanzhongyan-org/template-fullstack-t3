# template-fullstack-t3

[![CI](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/ci.yml/badge.svg)](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/ci.yml)
[![CodeQL](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/codeql.yml/badge.svg)](https://github.com/tanzhongyan-org/template-fullstack-t3/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A GitHub template for a typed web app: Next.js, tRPC, Drizzle on PostgreSQL, Tailwind and shadcn/ui. It is for developers and coding agents who start a new product and want working gates, feature folders, brand tokens, analytics, and a tenant-safe example on day one.

## Quick start

Install these first:

- [Bun](https://bun.sh) and Node.js 22 or later.
- [Docker](https://docs.docker.com/get-docker/), for the local PostgreSQL container.
- GNU make. On Windows run `winget install ezwinports.make`; on macOS run `xcode-select --install`. Restart your terminal and agent afterwards.

Then run:

```bash
gh repo create my-app --template tanzhongyan-org/template-fullstack-t3 --private --clone
cd my-app
make setup
bun run dev:setup
make dev
```

`make setup` installs dependencies and git hooks. `bun run dev:setup` copies `.env.example` to `.env`, starts PostgreSQL and creates the tables. `make dev` prints `Ready` and serves <http://localhost:3000>.

> [!NOTE]
> The `/notes` and `/examples` pages need an `x-user-id` request header, because `TRUST_IDENTITY_HEADER=true` is a stand-in for real authentication. Without it they show the signed-out state. The landing and legal pages are public.

## What you get

- Next.js 16 App Router, React 19, TypeScript strict mode.
- tRPC 11 with Zod input validation; notes, waitlist, feedback and example slices under `src/features/`.
- Drizzle ORM and generated SQL migrations in `drizzle/`.
- Tailwind CSS 4 and 12 shadcn/ui primitives in `src/shared/components/ui/`.
- Brand tokens in `packages/shared/tokens.ts` with `make tokens` and the `make contrast` AA gate; titles, nav and legal pages read `src/shared/config/site.ts`.
- PostHog taxonomy in `packages/shared/analytics.ts`, idempotent Stripe webhooks, usage ledger, budget alerts and a weekly digest.
- Storybook with mock tRPC providers and a theme switcher; Playwright smoke, nav crawler and axe checks.
- Eleven gates in `make check`: typecheck, Biome, Vitest, build, knip, fallow, ast-grep, policy, tokens, contrast and brand-check. Import boundaries between layers are ast-grep rules.
- CI with CodeQL, secret scanning, dependency audit and a weekly ZAP baseline scan, all called from the shared tanzhongyan-org/.github workflows.

## After creating your repo

1. The **Initialize Template Repository** workflow runs on your first push to `main`, or by hand from the Actions tab. It renames the placeholders and opens a "Template follow-ups" issue.
2. Run `make template-debt`. You see one line per `TEMPLATE-TODO` marker you must resolve.
3. Run `make brand-check`. It lists the `TEMPLATE-BRAND` slots (name, URLs, legal, colors) to fill from the DESIGN brief.

## Configuration

Copy `.env.example` to `.env`. The schema is in `src/shared/config/env.js`.

| Variable                         | Required | Default | Description                                                                                               |
| -------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | Yes      | none    | PostgreSQL connection string                                                                              |
| `DATABASE_DIRECT_URL`            | No       | none    | Direct (non-pooled) URL for migrations; falls back to `DATABASE_URL`                                      |
| `TRUST_IDENTITY_HEADER`          | No       | `false` | Honour the `x-user-id` header as caller identity. When false, every protected call returns `UNAUTHORIZED` |
| `POSTGRES_PORT`                  | No       | `5432`  | Host port for the PostgreSQL container. Change it when 5432 is already in use                             |
| `RESEND_API_KEY`                 | No       | none    | Resend key for transactional email. Unset means console mail in local development only                    |
| `EMAIL_FROM`                     | No       | none    | Sender address. Required when `RESEND_API_KEY` is set                                                     |
| `POSTHOG_API_KEY`                | No       | none    | PostHog Cloud project key. Unset disables analytics                                                       |
| `POSTHOG_HOST`                   | No       | none    | PostHog host. Defaults to the US cloud                                                                    |
| `CRON_SECRET`                    | No       | none    | Bearer secret for `/api/cron/*`. Unset means crons run in local development only                          |
| `STRIPE_WEBHOOK_SECRET`          | No       | none    | Webhook signing secret. Unset means the webhook route answers 503                                         |
| `TURNSTILE_SECRET_KEY`           | No       | none    | Turnstile secret for the waitlist form. Unset skips verification outside production                       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No       | none    | Turnstile site key. Unset hides the widget                                                                |

Set `AGENT_HOOK_SKIP=1` to skip the agent stop hook (the `make verify` run when an agent finishes).

## Commands

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `make setup`         | Install dependencies and git hooks                                |
| `make dev`           | Start the dev server                                              |
| `make verify`        | Fast gates, no database: typecheck, lint, ast-grep, policy, brand |
| `make check`         | Every gate, as CI runs it; needs `DATABASE_URL`                   |
| `make test`          | Run Vitest                                                        |
| `make lint`          | Biome and markdownlint                                            |
| `make fix`           | Apply Biome fixes                                                 |
| `make typecheck`     | Run `tsc`                                                         |
| `make build`         | Production build                                                  |
| `make knip`          | Dead code check                                                   |
| `make dupes`         | Duplicate code check                                              |
| `make anti-slop`     | ast-grep rules and their tests                                    |
| `make policy`        | Layout, docs, dependency ledger and version drift checks          |
| `make audit`         | Dependency vulnerability audit                                    |
| `make template-debt` | List `TEMPLATE-TODO` markers                                      |
| `make tokens`        | Generate stylesheets from `packages/shared/tokens.ts`             |
| `make contrast`      | Fail token pairs below WCAG AA                                    |
| `make brand-check`   | Brand wiring and forbidden defaults                               |
| `make licenses`      | License gate; writes `NOTICE`                                     |
| `make security`      | Audit, pin hygiene and the new-dependency age check               |
| `make restore-drill` | Restore `BACKUP_FILE` into a scratch database                     |
| `make seed`          | Seed the dev database: fixed seed, 2 tenants                      |
| `make new-feature`   | Scaffold `src/features/<name>` from the example slice             |
| `make evals`         | Run the golden-case evals                                         |
| `make stories`       | Start Storybook                                                   |
| `make e2e`           | Playwright smoke against `PREVIEW_URL` or local dev               |
| `make crawl`         | Nav crawler over the sitemap                                      |
| `make a11y`          | axe checks at 375 and 1280 px                                     |
| `make lighthouse`    | Lighthouse performance and a11y, 90 minimum                       |
| `make static-routes` | Prove public routes prerender                                     |
| `make db-generate`   | Generate a migration from `schema.ts`                             |
| `make db-migrate`    | Apply migrations                                                  |
| `make db-push`       | Sync the schema without a migration file                          |

## Project layout

| Path            | Holds                                         |
| --------------- | --------------------------------------------- |
| `src/app/`      | Routes and layouts                            |
| `src/features/` | One folder per feature                        |
| `src/server/`   | tRPC setup, database, email, analytics, usage |
| `src/shared/`   | UI primitives, config, helpers                |
| `packages/`     | Shared tokens and analytics taxonomy          |
| `e2e/`          | Playwright smoke, crawler and a11y specs      |
| `evals/`        | Golden cases for the example AI answer        |
| `.storybook/`   | Storybook config and mock providers           |
| `docs/`         | Decisions, dependency ledger                  |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the code map and [RUNBOOK.md](RUNBOOK.md) for operations.

## More

[CONTRIBUTING.md](.github/CONTRIBUTING.md) | [SECURITY.md](.github/SECURITY.md) | [LICENSE](LICENSE)
