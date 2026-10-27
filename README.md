# Fullstack T3 Web Application Template

Universal fullstack web application template (Next.js App Router, Drizzle ORM, tRPC, Tailwind CSS v4, shadcn/ui) with agentic quality guardrails and verification gates.

## Features

- **Runtime & Framework:** [Next.js 15+](https://nextjs.org/) App Router, React 19, TypeScript
- **Database & ORM:** PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **API Layer:** [tRPC 11](https://trpc.io/) end-to-end type safety without codegen
- **UI & Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Base Nova style), Lucide Icons
- **Config & Validation:** [@t3-oss/env-nextjs](https://env.t3.gg/) environment validation & Zod schemas
- **Code Quality:** [Biome](https://biomejs.dev/) (sub-100ms format & lint), Vitest, TypeScript strict mode
- **Agent Guardrails:**
  - `lefthook.yml`: Sub-second local Git pre-commit hooks
  - `fallow.jsonc`: AST-aware code duplication and cognitive complexity limits
  - `sgconfig.yml` + `.ast-grep/`: Automatic detection of placeholder stubs and unfulfilled code
  - `.github/workflows/ci.yml`: Automated CI running the 6 Universal Verification Gates
  - `AGENTS.md`: Runtime-specific agent invariants (L1 extension)

## Getting Started

### 1. Create a New Repository
Click **"Use this template"** on GitHub or use the GitHub CLI:
```bash
gh repo create my-app --template tanzhongyan-org/template-fullstack-t3 --private --clone
cd my-app
```
*(On first push to `main`, GitHub Actions automatically renames all template placeholders to your new repository name and self-deletes the initialization workflow).*

### 2. Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL in .env with your PostgreSQL credentials

# 3. Synchronize database schema
npm run db:push

# 4. Start development server
npm run dev
```

### 3. Run Verification Gates
```bash
# Gate 1: Typecheck
npm run typecheck

# Gate 2: Lint & Format
npm run lint

# Gate 3: Test & Build
npm test
npm run build

# Gate 5: Duplication Audit
npx --yes fallow@3.33.1 dupes --quiet --no-fragments

# Gate 6: Anti-Slop Scan
npx --yes --package @ast-grep/cli ast-grep scan
```
