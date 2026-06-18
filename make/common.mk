# Core development commands. Thin wrappers around the npm scripts.

.PHONY: help install lint format test check-all danger

help: ## Show available commands
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (npm ci)
	npm ci

lint: ## Lint and check formatting (Biome)
	npm run lint

format: ## Auto-format the codebase (Biome)
	npm run format

test: ## Run the test suite (node:test)
	npm test

check-all: lint test lockfile-check ## Run all checks: lint, tests, and lockfile sync

danger: ## Run Danger locally (danger ci)
	npm run danger
