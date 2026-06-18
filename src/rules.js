// PR-formatting rules for SoftwareONE repositories.
//
// Each rule is a pure function of the pull-request context and returns a list
// of messages ({ type: "warn" | "markdown", text }). Keeping the rules free of
// the Danger globals makes them unit-testable; `dangerfile.js` wires the real
// Danger context to these functions and emits the messages.

export const JIRA_KEY = "MPT";
export const JIRA_URL = "https://softwareone.atlassian.net/browse";
export const THRESHOLD = 600;

// A fresh regex per call: the `g` flag carries mutable `lastIndex` state, so a
// shared instance would leak between calls.
const jiraRegex = () => new RegExp(`\\b${JIRA_KEY}-\\d+\\b`, "g");

/**
 * The PR title must contain exactly one Jira issue key (e.g. `MPT-1234`).
 */
export function checkJiraInTitle(title) {
  const matches = (title || "").match(jiraRegex()) || [];

  if (matches.length === 0) {
    return [
      {
        type: "warn",
        text: `PR title must include exactly one Jira issue key in the format ${JIRA_KEY}-XXXX.`,
      },
    ];
  }

  if (matches.length > 1) {
    return [
      {
        type: "warn",
        text:
          `PR title contains multiple Jira issue keys: ${matches.join(", ")}. ` +
          `Please keep only one.`,
      },
    ];
  }

  const issue = matches[0];
  return [
    {
      type: "markdown",
      text: `✅ Found Jira issue key in the title: [${issue}](${JIRA_URL}/${issue})`,
    },
  ];
}

/**
 * The PR should not change more than THRESHOLD lines.
 */
export function checkPrSize({ additions = 0, deletions = 0, changedFiles = 0 }) {
  const totalChanged = additions + deletions;

  if (totalChanged > THRESHOLD) {
    return [
      {
        type: "warn",
        text:
          `This PR changes **${totalChanged}** lines across **${changedFiles}** files ` +
          `(threshold: ${THRESHOLD}). Please consider splitting it into smaller PRs for easier review.`,
      },
    ];
  }

  return [];
}

/**
 * Prefer a single commit per PR.
 */
export function checkSingleCommit(commits = []) {
  const commitCount = commits.length;

  if (commitCount > 1) {
    return [
      {
        type: "warn",
        text:
          `This PR contains **${commitCount} commits**.\n\n` +
          `Please squash them into a single commit to keep the git history clean and easy to follow.\n\n` +
          `Multiple commits are acceptable only in the following cases:\n` +
          `1. One commit is a technical refactoring, and another introduces business logic changes.\n` +
          `2. You are doing a complex multi-step refactoring (although in this case we still recommend splitting it into separate PRs).`,
      },
    ];
  }

  return [];
}

/**
 * PRs targeting a release branch must carry an [HF] or [Backport] marker.
 */
export function checkReleaseTag(title, baseBranch) {
  if (!(baseBranch || "").startsWith("release/")) {
    return [];
  }

  if (/\[(HF|Backport)\]/i.test(title || "")) {
    return [];
  }

  return [
    {
      type: "warn",
      text:
        `PRs targeting a release branch (**${baseBranch}**) must include [HF] or [Backport] in the title.\n\n` +
        `Example: \`[HF] MPT-1234 Fix crash on startup\` or \`[Backport] MPT-1234 Update dependency versions\`.`,
    },
  ];
}

/**
 * The branch history must be linear: no merge commits.
 */
export function checkMergeCommits(commits = []) {
  const mergeCommits = commits.filter(
    (c) =>
      (Array.isArray(c.parents) && c.parents.length > 1) ||
      /^merge\b/i.test(c.commit?.message || ""),
  );

  if (mergeCommits.length === 0) {
    return [];
  }

  const list = mergeCommits
    .map(
      (c) =>
        `- ${c.sha?.slice(0, 7) || "???????"} — ${c.commit?.message?.split("\n")[0] || "(no message)"}`,
    )
    .join("\n");

  return [
    {
      type: "warn",
      text:
        `This PR contains ${mergeCommits.length} merge commit(s).\n` +
        `Please use \`git pull --rebase\` to keep a clean, linear history.\n\n` +
        `Offending commits:\n${list}`,
    },
  ];
}

/**
 * Unique Jira issue keys found in the PR title, in order of first appearance.
 */
export function extractJiraKeys(title) {
  return Array.from(new Set((title || "").match(jiraRegex()) || []));
}

/**
 * Run every synchronous PR-formatting rule and collect their messages.
 *
 * The release -> main linkage check is intentionally excluded here: it is
 * asynchronous and depends on the GitHub API, so `dangerfile.js` schedules it
 * separately.
 *
 * @param {{ title?: string, additions?: number, deletions?: number,
 *   changedFiles?: number, commits?: Array<object>, baseBranch?: string }} ctx
 * @returns {Array<{ type: "warn" | "markdown", text: string }>}
 */
export function collectMessages(ctx) {
  return [
    ...checkJiraInTitle(ctx.title),
    ...checkPrSize(ctx),
    ...checkSingleCommit(ctx.commits),
    ...checkReleaseTag(ctx.title, ctx.baseBranch),
    ...checkMergeCommits(ctx.commits),
  ];
}
