---
name: msr-commit-workflow
description: Use when preparing or creating a Git commit in MSR Firebase. Covers author identity, scoped staging, commit messages, and repository checks.
---

# MSR Firebase commit workflow

Follow the current `AGENTS.md` and `.husky/pre-commit` when they provide more specific or newer instructions.

## Before staging

- Confirm the repository and branch. Review `git status`, staged and unstaged diffs, and recent commit messages.
- Check `git config user.name` and `git config user.email`. Confirm they match the intended GitHub identity and recent repository commits. If unclear or mismatched, stop; do not silently change Git configuration.
- Stage only files covered by the user's request. Use `git add -A` only when asked to commit all changes. Preserve unrelated work and inspect the staged diff.
- Commit only after explicit user authorization. A commit request does not authorize push, PR creation, release publication, or issue closure.

## Commit message

Use:

```text
#<issue number>: <concise imperative title>

<body explaining what changed and why>
```

Determine the issue number from the current task or explicit context. Do not guess it. Do not add AI attribution or `Co-Authored-By` lines.

## Validate and finish

- Inspect the staged file list and run `git diff --cached --check`.
- Read `.husky/pre-commit`; let the hook run and fix failures instead of bypassing it.
- Current hook checks lint and unit tests, then builds docs if Bundler is installed. Do not substitute Core's stricter hook or assume it runs the full emulator suite.
- After committing, verify the commit message and author and inspect `git status`. Report the commit hash and worktree state. Do not push unless separately authorized.
