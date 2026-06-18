import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkReleaseMainLinkage, renderLinkageTable } from "../src/release-linkage.js";

describe("renderLinkageTable", () => {
  it("renders a markdown table with a header", () => {
    const table = renderLinkageTable([["[MPT-1](url)", "[12](u) (merged)", "ok"]]);
    assert.match(table, /### Release → Main linkage check/);
    assert.match(table, /\| Jira issue \| PRs to main \(open\/merged\) \| Status \|/);
    assert.match(table, /\| \[MPT-1\]\(url\) \| \[12\]\(u\) \(merged\) \| ok \|/);
  });
});

/**
 * Build a mock GitHub API client from a per-key search result and a map of
 * PR number -> pull payload.
 */
function mockApi({ searchItems = [], pulls = {} } = {}) {
  return {
    search: {
      issuesAndPullRequests: async ({ q }) =>
        q.includes("is:open")
          ? { data: { items: searchItems.filter((i) => i.state === "open") } }
          : { data: { items: searchItems.filter((i) => i.state !== "open") } },
    },
    pulls: {
      get: async ({ pull_number }) => {
        const data = pulls[pull_number];
        if (!data) throw new Error("not found");
        return { data };
      },
    },
  };
}

describe("checkReleaseMainLinkage", () => {
  it("reports ok when a merged mainline PR exists", async () => {
    const api = mockApi({
      searchItems: [{ number: 12, state: "closed" }],
      pulls: {
        12: { base: { ref: "main" }, merged: true, state: "closed", html_url: "u12", title: "t" },
      },
    });

    const messages = await checkReleaseMainLinkage({ keys: ["MPT-1"], api, owner: "o", repo: "r" });

    assert.equal(messages.filter((m) => m.type === "warn").length, 0);
    const table = messages.find((m) => m.type === "markdown");
    assert.match(table.text, /\(merged\)/);
    assert.match(table.text, /ok/);
  });

  it("warns when no mainline PR exists for a key", async () => {
    const api = mockApi({ searchItems: [], pulls: {} });

    const messages = await checkReleaseMainLinkage({ keys: ["MPT-9"], api, owner: "o", repo: "r" });

    const warn = messages.find((m) => m.type === "warn");
    assert.ok(warn, "expected a warning");
    assert.match(warn.text, /No PR to \*\*main\*\* found for Jira issue/);
    assert.match(warn.text, /MPT-9/);
  });

  it("ignores PRs whose base is not main", async () => {
    const api = mockApi({
      searchItems: [{ number: 7, state: "open" }],
      pulls: {
        7: { base: { ref: "develop" }, merged: false, state: "open", html_url: "u7", title: "t" },
      },
    });

    const messages = await checkReleaseMainLinkage({ keys: ["MPT-7"], api, owner: "o", repo: "r" });

    assert.ok(messages.some((m) => m.type === "warn"));
  });
});
