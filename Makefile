.PHONY: default
default: clean build

.PHONY: clean
clean:
	rm -rf dist

node_modules:
	npm ci

.PHONY: deps
deps: node_modules

.PHONY: lint
lint: deps
	node_modules/.bin/eslint .

.PHONY: style
style: deps
	node_modules/.bin/prettier --check .

.PHONY: types
types: deps
	node_modules/.bin/svelte-kit sync
	node_modules/.bin/svelte-check --tsconfig ./tsconfig.json

.PHONY: lint-fix
lint-fix: deps
	node_modules/.bin/eslint --fix .

.PHONY: style-fix
style-fix: deps
	node_modules/.bin/prettier --write .

.PHONY: pretty
pretty: lint-fix style-fix

.PHONY: checks
checks: lint style types

dist: deps
	node_modules/.bin/svelte-kit sync
	node_modules/.bin/vite build
	node_modules/.bin/svelte-package
	node_modules/.bin/vite build --config vite.codegen.ts
	node_modules/.bin/publint

.PHONY: build
build: dist

.PHONY: publish
publish: dist
	npm view "$$( jq -r '.name + "@>=" + .version' package.json )" version >/dev/null 2>&1 || npm publish
