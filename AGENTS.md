# Fullstack T3 Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Next.js 15+ (App Router), React 19, TypeScript
- Data Layer: Drizzle ORM over PostgreSQL
- API Layer: tRPC 11 (end-to-end typed)
- UI Kit: Tailwind CSS v4 + shadcn/ui (Base Nova style)
- Environment: Validated via src/env.js (@t3-oss/env-nextjs)
- Test Runner: Vitest

## 2. Physical File Placement Rules
- App Pages & Layouts: Place in src/app/ (e.g. src/app/page.tsx, layout.tsx)
- tRPC Routers: Place in src/server/api/routers/<feature>.ts
- API Root Router: Export combined router in src/server/api/root.ts
- Database Models: Define tables in src/server/db/schema.ts
- UI Components: Place primitives in src/components/ui/ and composite widgets in src/components/
- Shared Utilities: Place helper functions in src/lib/ (e.g. src/lib/utils.ts)
- Test Suites: Sister-file colocated tests (e.g. src/lib/utils.test.ts)

## 3. Data Access & Mutation Invariants
- Direct access to process.env is forbidden. Import { env } from "~/env".
- Server API routes are defined using publicProcedure from "~/server/api/trpc".
- Database mutations must enforce ownership predicates: WHERE id = :id AND userId = :currentUserId.
- Schema migrations: Run npm run db:generate after modifying schema.ts.
- Rapid schema sync: Run npm run db:push during local prototyping.

## 4. The 6 Verification Gates
Run these commands to prove task completion:
1. Gate 1 (Typecheck): npm run typecheck
2. Gate 2 (Lint & Format): npm run lint (or npx @biomejs/biome check .)
3. Gate 3 (Tests & Build): npm test && npm run build
4. Gate 4 (Dead Code): Clean imports and zero orphan routes
5. Gate 5 (Duplication): npx --yes fallow@3.33.1 dupes --quiet --no-fragments
6. Gate 6 (Anti-Slop): npx --yes --package @ast-grep/cli ast-grep scan
