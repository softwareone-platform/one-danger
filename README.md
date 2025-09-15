# one-danger
Danger rules for SoftwareONE repositories


# Supported rules for the PR review

1. PR title contains at least 1 Jira item starting with MPT-
2. PR title doesn't contain multiple Jira items assigned
3. PR contains not more than 600 changes lines
4. PR doesn't have multiple commits, only one is recommended
5. PR for the release branch (aka `release/*`) also has corresponding PR to the main branch. The match is checked by Jira issue
6. PR for the release branch (aka `release/*`) contains `[HF]` or `[Backport]` labels in the title
7. PR should always contain changes in tests files if there was a change in the logic
8. PR doesn't contain merge commits. Using of `pull --rebase` is preferable
9. Tests files should have proper paths and names. Path should reflect the file under test path. File name should be same as original file name with `test_` prefix
