.PHONY: install dev test lint lint-fix check db-generate db-push db-migrate

install:
	npm install

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

lint-fix:
	npm run lint:fix

typecheck:
	npm run typecheck

build:
	npm run build

check:
	npm run typecheck
	npm run lint
	npm test
	npm run build
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli ast-grep scan

db-generate:
	npm run db:generate

db-push:
	npm run db:push

db-migrate:
	npm run db:migrate
