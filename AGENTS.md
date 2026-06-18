# AGENTS.md

`one-danger` is a reusable GitHub Action that runs [Danger JS](https://danger.systems/js/)
with SoftwareONE's shared **PR-formatting** rules.

## Reading order

1. `README.md` — what the action does and how to consume it.
2. `docs/architecture.md` — how the action and the rules are structured.
3. `docs/contributing.md` — development workflow and validation commands.
4. `docs/testing.md` — how the rules are tested.

## Shared standards

This repository follows the shared standards in the `mpt-extension-skills` repository
(`standards/`): `pull-requests.md`, `commit-messages.md`, `documentation.md`, `makefiles.md`.
Link to them; do not duplicate them here.

## Key paths

- `dangerfile.js` — Danger entry point; wires the Danger context to the rules.
- `src/rules.js` — synchronous PR-formatting rules (pure, unit-tested).
- `src/release-linkage.js` — asynchronous release→main linkage check.
- `tests/` — `node:test` suites.
- `dist/index.js` — action launcher that runs `danger ci` at runtime.
- `action.yml` — GitHub Action definition.
- `.github/workflows/` — CI (`pr-build.yml`, runs `make check-all`) and release (`release.yml`).

## Conventions

- Node.js (ESM), Node 20+.
- Biome for lint and formatting; `node:test` for tests.
- Use the `Makefile` targets (`make check-all`, `make test`, ...); they wrap the npm scripts.
