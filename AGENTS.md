# Repository Engineering Guide

This is the single agent instruction file for the repository. Cursor, Claude Code, Codex, Copilot, and Gemini all read it. Do not add CLAUDE.md, GEMINI.md, .cursorrules, or .github/copilot-instructions.md; `make policy` rejects them. Keep personal editor workflows out of the repository.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict, Bun
- PostgreSQL with Drizzle ORM; tRPC 11; Tailwind CSS 4 with shadcn/ui (Base UI)
- Environment validation (`@t3-oss/env-nextjs`): `src/shared/config/env.js`
- Auth session boundary: `src/server/auth/index.ts` (`protectedProcedure` and `adminProcedure`)
- Payment gateway interface: `src/server/payments/`
- Tests: Vitest (`*.test.ts` unit, `*.db.test.ts` Postgres), Playwright (`e2e/`), Storybook (`.storybook/`)
- Brand tokens: `packages/shared/tokens.ts`; Analytics taxonomy: `packages/shared/analytics.ts`

## Architecture & Conventions

- Read the full code map and request flow in `ARCHITECTURE.md` before writing new modules.
- Group product code into vertical slices under `src/features/<name>/` (components, schemas, server, and index.ts). Scaffold new features with `make new-feature name=<kebab-case>`; never copy `src/features/_example/` by hand. Remove the starter demo once ready with `make clean-examples`.
- Follow layer boundaries enforced by `make anti-slop`:
  - Read env vars only via `{ env }` from `~/shared/config/env`.
  - `"use client"` files never import `~/server/**` or `server-only`; call procedures through `~/trpc/react` (or `~/trpc/server` in RSC).
  - Features import other features only via `~/features/<name>`; `src/shared/**` never imports `~/features/**`.
  - Route handlers parse inputs with `parseJsonBody` or `readRawBody` from `~/server/api/parse`.
  - Log JSON lines via `src/server/log.ts`; never call `console.log`/`console.info`/`console.debug` in app code.
  - Store money as integer minor units (`amountMinor`, `d.integer()`); never use floats.
  - Use tokens from `packages/shared/tokens.ts` (`make tokens`) and primitives from `src/shared/components/ui/`.
- Filter every user-owned query and mutation by `ctx.ownerId`, or gate privileged views with `adminProcedure`. Prove tenant isolation with tests.
- Run `make db-generate` after changing `src/server/db/schema.ts`. `make db-check` fails on unmigrated schema drift.
- Add new top-level folders only via `scripts/repo-policy.json`, and log every direct dependency in `docs/dependencies.md` (with rationale in `docs/decisions/0003-frontend-dependency-policy.md`).

## Verification Gates

Run `make doctor` on first setup, `make verify` while working, and `make check` before merging:

1. `make typecheck` — strict TypeScript check
2. `make lint` — Biome formatting/lint + markdownlint
3. `make test-unit` (in `make verify`) / `make test` (in `make check`) — Vitest unit and DB tests with coverage
4. `make build` — Next.js production build
5. `make knip` & `make dupes` — unused code and copy-paste detection
6. `make anti-slop` & `make policy` — ast-grep architectural boundaries, docs integrity, and dependency ledger
7. `make tokens`, `make contrast`, `make brand-check` — design tokens, WCAG 2.2 AA contrast, brand wiring
8. `make db-check` — Drizzle snapshot and schema drift verification

See `docs/recipes/` for opt-in auth providers, global payment adapters, observability/replay, AI metering crons, and waitlists.
