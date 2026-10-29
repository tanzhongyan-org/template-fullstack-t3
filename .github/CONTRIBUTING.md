# Contributing

## Prerequisites

| Tool     | Version source                     | Install                               |
| -------- | ---------------------------------- | ------------------------------------- |
| Bun      | `packageManager` in `package.json` | <https://bun.sh>                      |
| Node.js  | `engines.node` in `package.json`   | <https://nodejs.org>                  |
| Docker   | any current version                | <https://docs.docker.com/get-docker/> |
| GNU Make | any version                        | your package manager                  |

All other tools (Biome, knip, fallow, ast-grep, lefthook, markdownlint) install from `package.json`.

## Set up

```bash
make setup
bun run dev:setup
```

You see `[READY] Environment is ready.` at the end.

## Daily loop

```bash
make verify
make check
```

`make verify` runs typecheck, lint, anti-slop rules, policy and the brand gates in a few seconds with no database. `make check` adds tests, build, knip and fallow, and needs `DATABASE_URL` pointing at a migrated database. Both print nothing noisy on success and a failing gate on error.

## Add a feature

Scaffold the slice instead of writing it by hand:

```bash
make new-feature name=<name>
```

It copies `src/features/_example/`, renames identifiers, registers the router in `src/server/api/root.ts` and scaffolds `src/app/<name>/` pages, so every gate passes without further edits. Then:

1. Rename the shared `examples` table in `src/server/db/schema.ts` when your shape diverges, then run `make db-generate`.
2. Extend the Zod schemas, router and components; keep `protectedProcedure` and the owner filter.
3. Write tests that call the router through `appRouter.createCaller`, including a cross-tenant read that returns `NOT_FOUND`.
4. Update the code map in `ARCHITECTURE.md` and add a row to `docs/dependencies.md` for any new dependency.
5. Run `make check`.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org): `feat(notes): add pinning`. The `commit-msg` hook rejects other formats and AI `Co-Authored-By` trailers. Fill in the pull request template. `ci-passed` must be green.

## Where docs go

See [docs/README.md](../docs/README.md). A new top-level or `src/` directory needs an ADR in `docs/decisions/` and a `layout.allow` change in `scripts/repo-policy.json`, in the same pull request.

## Maintainer notes

- **Rulesets.** `.github/rulesets/main.json` is an export of a branch ruleset that requires `ci-passed` and CodeQL results. Import it under Settings, Rules, Rulesets, Import a ruleset. Nothing applies it automatically.
- **Renovate.** `.github/renovate.json` groups non-major updates and pins GitHub Actions to digests.
- **Template debt.** Run `make template-debt` to list what a derived repository must change.
- **Licence holder.** TEMPLATE-TODO(license): replace the copyright holder in `LICENSE` in derived repositories.
