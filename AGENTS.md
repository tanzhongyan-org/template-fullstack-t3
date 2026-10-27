# Project Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Next.js 15+ (App Router), React 19, TypeScript
- Data Layer: Drizzle ORM over PostgreSQL
- API Layer: tRPC 11 (end-to-end typed)
- UI Kit: Tailwind CSS v4 + shadcn/ui
- Environment: Validated via src/env.js (@t3-oss/env-nextjs)

## 2. Physical File Placement Rules
- New Feature: Place in src/features/<feature_name>/
- Feature Endpoints: Place in src/features/<feature_name>/server/router.ts
- Feature UI: Place in src/features/<feature_name>/components/
- Shared UI: Components used by >= 2 features belong in src/shared/components/
- Database Models: Define tables in src/server/db/schema.ts

## 3. Data Access & Mutation Invariants
- Direct access to process.env is forbidden. Import { env } from "@/env".
- Public reads use publicProcedure.
- Authenticated mutations use protectedProcedure with tenant predicates:
  WHERE id = :id AND userId = :currentUserId.
- Schema migrations: Run npm run db:generate after modifying schema.ts.
- Rapid schema sync: Run npm run db:push during local prototyping.

## 4. The 6 Verification Gates
Run these commands to prove task completion:
1. Gate 1 (Typecheck): npm run typecheck
2. Gate 2 (Lint & Format): npx @biomejs/biome check . (or npm run lint)
3. Gate 3 (Build & Tests): npm run build
4. Gate 4 (Dead Code): Clean imports and zero orphan routes
5. Gate 5 (Duplication): npx --yes fallow@3.33.1 dupes --quiet --no-fragments
6. Gate 6 (Anti-Slop): npx --yes --package @ast-grep/cli ast-grep scan
