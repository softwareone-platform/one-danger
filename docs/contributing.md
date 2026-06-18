# Contributing

## Shared standards

This repository follows the shared SoftwareONE standards. Do not duplicate them here — link to
them:

- Pull requests: `standards/pull-requests.md`
- Commit messages: `standards/commit-messages.md` (Conventional Commits, body required)
- Documentation: `standards/documentation.md`
- Makefile: `standards/makefiles.md`

## Validation

Run before opening a pull request:

```bash
make check-all   # lint (Biome) + tests (node:test) + lockfile sync
```

Individual commands:

```bash
make lint            # Biome check
make format          # Biome auto-format
make test            # node --test
make lockfile-check  # fail if package-lock.json is out of sync with package.json
make danger          # run Danger locally (danger ci)
```

## Changing rules

- Synchronous PR-formatting rules live in `src/rules.js`.
- The asynchronous release→main linkage check lives in `src/release-linkage.js`.
- Every new or changed rule must be covered by a test in `tests/`. See
  [testing.md](testing.md).
