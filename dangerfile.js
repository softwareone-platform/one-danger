import { danger, markdown, schedule, warn } from "danger";
import { checkReleaseMainLinkage } from "./src/release-linkage.js";
import { collectMessages, extractJiraKeys, JIRA_KEY } from "./src/rules.js";

const pr = danger.github.pr;

const ctx = {
  title: pr.title || "",
  additions: pr.additions || 0,
  deletions: pr.deletions || 0,
  changedFiles: pr.changed_files || 0,
  commits: danger.github.commits || [],
  baseBranch: pr.base?.ref || "",
};

// Emit every synchronous PR-formatting rule.
for (const { type, text } of collectMessages(ctx)) {
  if (type === "warn") {
    warn(text);
  } else {
    markdown(text);
  }
}

// Release -> main linkage: PRs to a release branch must have a corresponding
// mainline PR. This is asynchronous (GitHub API), so it runs via schedule().
if (ctx.baseBranch.startsWith("release/")) {
  const keys = extractJiraKeys(ctx.title);

  if (keys.length === 0) {
    warn(
      `This PR targets **${ctx.baseBranch}**, but its title does not include a Jira issue key (expected format: ${JIRA_KEY}-XXXX).`,
    );
  } else {
    schedule(
      checkReleaseMainLinkage({
        keys,
        api: danger.github.api,
        owner: danger.github.thisPR.owner,
        repo: danger.github.thisPR.repo,
      }).then((messages) => {
        for (const { type, text } of messages) {
          if (type === "warn") {
            warn(text);
          } else {
            markdown(text);
          }
        }
      }),
    );
  }
}
