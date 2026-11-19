---
name: msr-github-pr
description: Use when inspecting or updating MSR Firebase issues and task pull requests, including labels, milestones, assignees, and Development links.
---

# MSR Firebase GitHub issue and pull request workflow

Follow [AGENTS.md](../../../AGENTS.md). The helper implements the repeatable PR metadata and Development-link steps; do not recreate that logic manually.

## Before running the helper

1. From the Firebase project root, inspect the issue description and comments, state, assignee, labels, milestone, and linked PRs. Check related issues for dependencies, overlap, and stale scope.
2. Confirm the target branch from the issue and release plan. A versioned milestone alone does not imply a release branch.
3. Confirm GitHub CLI authentication from the project directory with gh auth status --hostname github.com. Never print or paste tokens.
4. Ensure the task branch is pushed and the local checkout is clean and at the same commit as origin/head.
5. Prepare a PR body file explaining changes and validation. Do not include a closing keyword such as “Closes #<issue>”; the helper creates the Development relationship.

## Create or update a task PR

Only run after explicit user authorization:

~~~bash
node .agents/skills/msr-github-pr/scripts/manage-pr.mjs \
  --issue <issue-number> \
  --base <approved-target-branch> \
  --title "#<issue-number>: <imperative title>" \
  --body-file <path-to-pr-body>
~~~

The helper requires an explicit base branch, verifies it exists in the upstream repository, checks that it is run from the Firebase project root, and refuses dirty or unpushed task branches and duplicate closed PRs. It copies the issue's assignee, labels, and milestone to the PR, then links the issue through GitHub GraphQL's addCloseIssueReferences mutation and verifies the resulting PR metadata and Development relationship.

The helper does not commit, push, merge, or close issues. Do not merge unless asked. Close an issue only after merge and a separate user request.
