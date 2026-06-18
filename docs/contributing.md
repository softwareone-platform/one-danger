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

## Continuous integration

`.github/workflows/pr-build.yml` runs on every pull request (and on pushes to `main` and
`release/*`). It installs dependencies and runs `make check-all` (Biome, tests, and the
lockfile-sync check). PRs must be green before merge.

## Releasing

The action has no build step — `dist/index.js` is a plain launcher that runs `danger ci` at
runtime, so a release is just a tag plus a GitHub Release.

Releases are cut by the **Release** workflow (`.github/workflows/release.yml`), triggered
manually with `workflow_dispatch`:

1. Run the workflow against the branch you want to release from (`main` → pre-release,
   `release/*` → latest), passing a `version` input in **`X.Y.Z` format, without a `v` prefix**
   (for example `1.2.3`).
2. The workflow validates the version, then:
   - creates the annotated tag `X.Y.Z`,
   - creates a GitHub Release titled **`vX.Y.Z`** with auto-generated notes (categorized via
     `.github/release.yml`), and
   - for stable (`release/*`) releases, moves the major tag (for example `1`) to the release
     commit.

The tag is `X.Y.Z`; only the GitHub Release title carries the `v` prefix.

Consumers pin the major tag:

```yaml
- uses: softwareone-platform/one-danger@1
```
