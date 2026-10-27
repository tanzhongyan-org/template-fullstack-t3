# Fullstack T3 Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Next.js 15+ (App Router), React 19, TypeScript (strict mode)
- Data Layer: PostgreSQL with Drizzle ORM (`src/server/db/`)
- API Layer: tRPC 11 (`src/server/api/`)
- UI Kit: Tailwind CSS v4 + shadcn/ui (Base Nova style, `@base-ui/react`)
- Environment Validation: `@t3-oss/env-nextjs` via `src/env.js`
- Test Runner: Vitest (`*.test.ts`)

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
- Direct access to `process.env` is forbidden. Always import `{ env }` from `"~/env"`.
- Server API procedures must use `publicProcedure` from `"~/server/api/trpc"`.
- Client Components fetch via `api.<router>.<procedure>.useQuery()` from `"~/trpc/react"`.
- Server Components fetch via `api.<router>.<procedure>()` from `"~/trpc/server"`.
- Database Migrations: Run `npm run db:generate` after modifying `schema.ts`.
- Prototyping Schema Push: Run `npm run db:push` for local rapid development.

## 4. Verification Gates
Run these commands to prove task completion:
1. Gate 1 (Typecheck): `npm run typecheck`
2. Gate 2 (Lint & Format): `npm run lint`
3. Gate 3 (Tests): `npm test`
4. Gate 5 (Duplication): `npx --yes fallow@3.33.1 dupes --quiet --no-fragments`
5. Gate 6 (Anti-Slop): `npx --yes --package @ast-grep/cli ast-grep scan`
