---
name: msr-github-release-notes
description: Use when drafting or revising MSR Firebase GitHub Release titles and notes from verified release scope.
---

# MSR Firebase GitHub release notes

Use this skill for user-facing GitHub Release text. Follow [AGENTS.md](../../../AGENTS.md) and the repository's release conventions.

## Establish release scope

- Review the milestone, its issues and merged PRs, the previous published tag, `package.json`, and the release state.
- Include only merged and verified work. Link each user-visible change to its relevant GitHub issue.
- Verify behavior and upgrade steps against code, tests, and documentation. Do not invent dates, compatibility claims, metrics, or included work.
- Keep the CHANGELOG and migration-guide edits in [#82](https://github.com/migration-script-runner/msr-firebase/issues/82); follow [the changelog skill](../msr-release-changelog/SKILL.md) for those files.

## Write the notes

- Use a descriptive version title and a short overview that says what users gain.
- Group features, fixes, and breaking changes by user-visible area. Explain practical impact; include examples only when verified and useful.
- Link issue references near the related change rather than collecting them in a detached list.
- Keep internal automation and repository maintenance secondary to user-facing changes.
- Do not add `Contributors` or `Related Releases` sections.
- Include installation instructions only after confirming the package is published. A draft release is not a published package.

Preparing notes does not authorize creating tags, publishing a package, or publishing a GitHub release. Do those only when explicitly requested.
