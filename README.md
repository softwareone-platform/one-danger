# one-danger

Shared [Danger JS](https://danger.systems/js/) rules for SoftwareONE repositories, packaged
as a reusable GitHub Action. Danger enforces **PR-formatting** rules deterministically; code
and documentation review stays with CodeRabbit.

## PR-formatting rules

1. The PR title contains exactly one Jira issue key (`MPT-XXXX`).
2. The PR changes no more than 600 lines (warning).
3. The PR has a single commit (warning; intentional separation is allowed).
4. The history is linear — no merge commits (use `git pull --rebase`).
5. PRs targeting a `release/*` branch include `[HF]` or `[Backport]` in the title.
6. PRs targeting a `release/*` branch have a corresponding open or merged PR to `main`
   (matched by Jira issue key).

## Usage

Add the action to a pull-request workflow. It needs `pull-requests: write` and a token:

```yaml
permissions:
  contents: read
  pull-requests: write

jobs:
  danger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: softwareone-platform/one-danger@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Local development

Requires Node.js 20+.

```bash
make help      # list available commands
make install   # install dependencies
make check-all # lint (Biome) + tests (node:test) + lockfile sync
```

## Documentation

- [AGENTS.md](AGENTS.md) — navigation for AI agents
- [docs/architecture.md](docs/architecture.md) — structure and components
- [docs/contributing.md](docs/contributing.md) — workflow and validation
- [docs/testing.md](docs/testing.md) — testing strategy
