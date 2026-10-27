.PHONY: setup dev test lint fix typecheck check build db-generate db-push db-migrate

setup:
	bun install --frozen-lockfile

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

check:
	bun run typecheck
	bun run lint
	bun run test
	bun run build
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli ast-grep scan

db-generate:
	bun run db:generate

db-push:
	bun run db:push

db-migrate:
	bun run db:migrate
