import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkJiraInTitle,
  checkMergeCommits,
  checkPrSize,
  checkReleaseTag,
  checkSingleCommit,
  collectMessages,
  extractJiraKeys,
  THRESHOLD,
} from "../src/rules.js";

describe("checkJiraInTitle", () => {
  it("warns when the title has no Jira key", () => {
    const [msg] = checkJiraInTitle("Fix the thing");
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /must include exactly one Jira issue key/);
  });

  it("acknowledges exactly one Jira key with a link", () => {
    const [msg] = checkJiraInTitle("MPT-1234 Fix the thing");
    assert.equal(msg.type, "markdown");
    assert.match(
      msg.text,
      /\[MPT-1234\]\(https:\/\/softwareone\.atlassian\.net\/browse\/MPT-1234\)/,
    );
  });

  it("warns when the title has multiple Jira keys", () => {
    const [msg] = checkJiraInTitle("MPT-1 and MPT-2 together");
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /MPT-1, MPT-2/);
  });

  it("treats a missing title as no key", () => {
    const [msg] = checkJiraInTitle(undefined);
    assert.equal(msg.type, "warn");
  });
});

describe("checkPrSize", () => {
  it("is silent at or below the threshold", () => {
    assert.deepEqual(checkPrSize({ additions: 300, deletions: 300 }), []);
  });

  it("warns above the threshold", () => {
    const [msg] = checkPrSize({ additions: THRESHOLD, deletions: 1, changedFiles: 5 });
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /threshold: 600/);
    assert.match(msg.text, /5\*\* files/);
  });
});

describe("checkSingleCommit", () => {
  it("is silent for a single commit", () => {
    assert.deepEqual(checkSingleCommit([{}]), []);
  });

  it("is silent for an empty commit list", () => {
    assert.deepEqual(checkSingleCommit(), []);
  });

  it("warns for multiple commits", () => {
    const [msg] = checkSingleCommit([{}, {}]);
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /\*\*2 commits\*\*/);
  });
});

describe("checkReleaseTag", () => {
  it("is silent for non-release branches", () => {
    assert.deepEqual(checkReleaseTag("MPT-1 anything", "main"), []);
  });

  it("accepts [HF] on a release branch", () => {
    assert.deepEqual(checkReleaseTag("[HF] MPT-1 fix", "release/5"), []);
  });

  it("accepts [Backport] on a release branch (case-insensitive)", () => {
    assert.deepEqual(checkReleaseTag("[backport] MPT-1 fix", "release/5"), []);
  });

  it("warns on a release branch without a marker", () => {
    const [msg] = checkReleaseTag("MPT-1 fix", "release/5");
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /must include \[HF\] or \[Backport\]/);
  });
});

describe("checkMergeCommits", () => {
  it("is silent without merge commits", () => {
    assert.deepEqual(
      checkMergeCommits([{ sha: "abc", parents: [{}], commit: { message: "feat" } }]),
      [],
    );
  });

  it("detects a commit with more than one parent", () => {
    const [msg] = checkMergeCommits([
      { sha: "deadbeef", parents: [{}, {}], commit: { message: "x" } },
    ]);
    assert.equal(msg.type, "warn");
    assert.match(msg.text, /1 merge commit/);
    assert.match(msg.text, /deadbee/);
  });

  it("detects a commit whose message starts with 'Merge'", () => {
    const [msg] = checkMergeCommits([
      { sha: "abc1234", parents: [{}], commit: { message: "Merge branch 'main'" } },
    ]);
    assert.equal(msg.type, "warn");
  });
});

describe("extractJiraKeys", () => {
  it("returns unique keys in order", () => {
    assert.deepEqual(extractJiraKeys("MPT-1 MPT-2 MPT-1"), ["MPT-1", "MPT-2"]);
  });

  it("returns an empty list when there are no keys", () => {
    assert.deepEqual(extractJiraKeys("no keys here"), []);
  });
});

describe("collectMessages", () => {
  it("acknowledges a clean PR with only the Jira-key markdown", () => {
    const messages = collectMessages({
      title: "MPT-1234 Add validation",
      additions: 10,
      deletions: 2,
      changedFiles: 3,
      commits: [{ sha: "abc", parents: [{}], commit: { message: "feat" } }],
      baseBranch: "main",
    });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].type, "markdown");
  });

  it("aggregates warnings from multiple failing rules", () => {
    const messages = collectMessages({
      title: "no jira key",
      additions: 1000,
      deletions: 0,
      changedFiles: 10,
      commits: [{}, {}],
      baseBranch: "release/5",
    });
    const warnings = messages.filter((m) => m.type === "warn");
    // missing Jira key + oversized + multiple commits + missing release marker
    assert.equal(warnings.length, 4);
  });
});
