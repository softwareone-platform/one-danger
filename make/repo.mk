# Repository and dependency management commands.

.PHONY: deps-lock lockfile-check clean

deps-lock: ## Refresh package-lock.json from package.json without installing
	npm install --package-lock-only --no-audit --no-fund

lockfile-check: ## Fail if package-lock.json is out of sync with package.json
	@npm ci --dry-run --no-audit --no-fund >/dev/null 2>&1 \
		|| { echo "❌ package-lock.json is out of sync with package.json — run 'make deps-lock' and commit the result."; exit 1; }

clean: ## Remove installed dependencies
	rm -rf node_modules
