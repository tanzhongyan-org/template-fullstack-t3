# Fullstack T3 Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Next.js 16.4.3 (App Router), React 19, TypeScript (strict mode), Bun 1.4.3
- Data Layer: PostgreSQL with Drizzle ORM (`src/server/db/`)
- API Layer: tRPC 11 (`src/server/api/`)
- UI Kit: Tailwind CSS v4 + shadcn/ui (Base Nova style, `@base-ui/react`)
- Environment Validation: `@t3-oss/env-nextjs` via `src/env.js`
- Test Runner: Vitest (`*.test.ts`) via `bun run test`
- Task Runner: Universal Makefile (`setup`, `dev`, `test`, `lint`, `fix`, `typecheck`, `check`, `build`, `db-generate`, `db-push`, `db-migrate`)

## 2. Physical File Placement Rules
- App Pages & Layouts: `src/app/` (e.g. `src/app/page.tsx`, `layout.tsx`)
- Global Styles: `src/app/globals.css`
- UI Primitives (shadcn): `src/components/ui/`
- Domain Components: `src/components/` or `src/app/_components/`
- tRPC Routers: `src/server/api/routers/<feature>.ts`
- API Root Router: Export combined router in `src/server/api/root.ts`
- Database Models: Define tables in `src/server/db/schema.ts`
- Shared Utilities: Helper functions in `src/lib/` (e.g. `src/lib/utils.ts`)
- Test Suites: Sister-file colocated tests (e.g. `src/lib/utils.test.ts`)

## 3. Data Access & Invariants
- Direct access to `process.env` is forbidden. Always import `{ env }` from `"~/env"` [review-only].
- Server API procedures must use `publicProcedure` from `"~/server/api/trpc"` [review-only].
- Client Components fetch via `api.<router>.<procedure>.useQuery()` from `"~/trpc/react"` [review-only].
- Server Components fetch via `api.<router>.<procedure>()` from `"~/trpc/server"` [review-only].
- Database Migrations: Run `bun run db:generate` after modifying `schema.ts`.
- Prototyping Schema Push: Run `bun run db:push` for local rapid development.

## 4. Verification Gates
Run `make check` to verify task completion:
1. Gate 1 (Typecheck): `bun run typecheck`
2. Gate 2 (Lint & Format): `bun run lint`
3. Gate 3 (Tests & Build): `bun run test && bun run build`
4. Gate 4 (Dead Code): `bun run build` (Next.js and tsc compilation analysis)
5. Gate 5 (Duplication): `npx --yes fallow@3.33.1 dupes --quiet --no-fragments`
6. Gate 6 (Anti-Slop): `npx --yes --package @ast-grep/cli ast-grep scan`
