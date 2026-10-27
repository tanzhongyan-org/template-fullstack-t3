.PHONY: setup dev test lint fix typecheck check build db-generate db-push db-migrate audit

setup:
	bun install --frozen-lockfile
	bunx lefthook@2.2.2 install

dev:
	bun run dev

test:
	bun run test

lint:
	bun run lint

fix:
	bun run lint:fix

typecheck:
	bun run typecheck

build:
	bun run build

audit:
	bun audit

check:
	bun run typecheck
	bun run lint
	bun run test
	bun run build
	DATABASE_URL="postgresql://postgres:password@localhost:5432/db" bunx knip@6.43.0
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli@0.51.0 ast-grep scan
	npx --yes --package @ast-grep/cli@0.51.0 ast-grep test --skip-snapshot-tests

db-generate:
	bun run db:generate

db-push:
	bun run db:push

db-migrate:
	bun run db:migrate
