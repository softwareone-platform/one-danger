# Testing

Tests use the built-in Node.js test runner (`node:test`). There is no external test framework.

## Run

```bash
make test    # or: npm test  (runs `node --test`)
```

## Strategy

- The rules in `src/rules.js` are pure functions that return `{ type, text }` messages. Each
  rule is tested with both passing and failing inputs in `tests/rules.test.js`.
- `src/release-linkage.js` is tested in `tests/release-linkage.test.js` with a mock GitHub API
  client, so the suite makes no network calls.
- Every new or changed rule must be covered by a test.

## Constraints

- Tests must not require network access or real GitHub credentials.
- Keep rule functions pure so they stay testable without the Danger runtime.
