# Architecture

`one-danger` is a Node.js (ESM) GitHub Action that runs Danger JS with shared PR-formatting
rules.

## Components

- `action.yml` — Action definition; runs `dist/index.js` on the Node 20 runtime.
- `dist/index.js` — Launcher. Installs the action's dependencies and then runs
  `danger ci --dangerfile dangerfile.js` against the workspace at runtime. It is a thin
  process wrapper and does **not** bundle the rules.
- `dangerfile.js` — Danger entry point. Builds a plain context object from the Danger globals
  and emits the messages produced by the rules.
- `src/rules.js` — Pure, synchronous PR-formatting rules. Each rule takes a context object and
  returns a list of `{ type, text }` messages.
- `src/release-linkage.js` — Asynchronous release→main linkage check. The GitHub API client is
  injected so the check can run with a mock in tests.
- `tests/` — `node:test` suites for the rules.

## Why the rules are separated from the Danger globals

Danger evaluates `dangerfile.js` with injected globals (`danger`, `warn`, `markdown`,
`schedule`). Keeping the rule logic in plain functions that return messages lets the test suite
exercise every rule directly, without the Danger runtime, while `dangerfile.js` stays a thin
adapter that maps the real context onto those functions and emits their output.

## Scope

Danger owns only PR-formatting rules. Code and documentation review is handled by CodeRabbit.
See `standards/pull-requests.md` in the shared standards.
