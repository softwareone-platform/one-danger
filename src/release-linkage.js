// Release -> main linkage check.
//
// For a PR opened against a `release/*` branch, every Jira issue key in the
// title must have a corresponding PR to `main` that is open or already merged.
//
// The GitHub API client is injected so the logic can be unit-tested with a mock
// `api`; `dangerfile.js` passes the real `danger.github.api`.

import { JIRA_URL } from "./rules.js";

/**
 * For each key, find PRs to `main` in the repo that mention it and report
 * whether a valid (open or merged) mainline PR exists.
 *
 * @param {object} params
 * @param {string[]} params.keys - Jira issue keys from the PR title.
 * @param {object} params.api - GitHub API client (Octokit-shaped).
 * @param {string} params.owner
 * @param {string} params.repo
 * @returns {Promise<Array<{ type: "warn" | "markdown", text: string }>>}
 */
export async function checkReleaseMainLinkage({ keys, api, owner, repo }) {
  const messages = [];
  const rows = [];

  for (const key of keys) {
    const jiraLink = `[${key}](${JIRA_URL}/${key})`;

    const qBase = `"${key}" repo:${owner}/${repo} is:pr base:main`;
    const openRes = await api.search.issuesAndPullRequests({ q: `${qBase} is:open` });
    const closedRes = await api.search.issuesAndPullRequests({ q: `${qBase} is:closed` });

    const items = [...(openRes.data.items || []), ...(closedRes.data.items || [])];
    const numbers = Array.from(new Set(items.map((i) => i.number).filter(Boolean)));

    const details = [];
    for (const number of numbers) {
      try {
        const { data: prData } = await api.pulls.get({
          owner,
          repo,
          pull_number: number,
        });
        if (prData.base?.ref !== "main") continue;

        details.push({
          number,
          html_url: prData.html_url,
          status: prData.merged ? "merged" : prData.state === "open" ? "open" : "closed",
          title: prData.title || "",
        });
      } catch {
        // ignore individual fetch errors
      }
    }

    const valid = details.filter((d) => d.status === "open" || d.status === "merged");

    if (valid.length === 0) {
      messages.push({
        type: "warn",
        text:
          `No PR to **main** found for Jira issue ${jiraLink}. ` +
          `Please create (or reference) a mainline PR for this change, or ensure it has already been merged.`,
      });
      rows.push([jiraLink, "—", "not found"]);
    } else {
      const list = valid.map((v) => `[${v.number}](${v.html_url}) (${v.status})`).join(", ");
      rows.push([jiraLink, list, "ok"]);
    }
  }

  if (rows.length) {
    messages.push({ type: "markdown", text: renderLinkageTable(rows) });
  }

  return messages;
}

/**
 * Render the "Release -> Main linkage check" markdown table.
 *
 * @param {Array<[string, string, string]>} rows
 * @returns {string}
 */
export function renderLinkageTable(rows) {
  const table = [
    "| Jira issue | PRs to main (open/merged) | Status |",
    "|---|---|---|",
    ...rows.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`),
  ].join("\n");

  return `### Release → Main linkage check\n${table}`;
}
