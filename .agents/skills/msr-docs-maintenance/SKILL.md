---
name: msr-docs-maintenance
description: Use when changing MSR Firebase user or contributor documentation and coordinating updates across the README, docs site, migration guide, changelog, or release notes.
---

# MSR Firebase documentation maintenance

Use this skill to locate the right documentation, keep it aligned with the repository, and verify the published docs build. Follow [AGENTS.md](../../../AGENTS.md) and make only the documentation changes relevant to the request.

## Documentation map

- `README.md` is the repository landing page: product summary, feature highlights, quick start, and current release highlights.
- `docs/` contains the Jekyll site. Start at `docs/index.md` for Home, `docs/features.md` for the feature overview, `docs/getting-started.md` for initial setup, and the relevant `docs/cli-usage/`, `docs/library-usage/`, `docs/api/`, or `docs/writing-migrations/` guide for details.
- `docs/version-migration/index.md` is the policy and navigation for upgrade guides. Update it when adding, removing, or renaming a guide; keep front matter and generated links consistent.
- `CHANGELOG.md` is the root release history and follows Keep a Changelog. Verify entries against merged issues, code, and package metadata; do not describe a draft as published or invent dates.
- `docs/README.md` describes the documentation source tree and contributor workflow. Change it only when that structure or workflow changes.
- `.github/workflows/` defines repository automation. For workflow behavior that affects contributors, keep `docs/cli-usage/ci-cd.md` accurate. Avoid promoting internal maintenance details as product features unless the request calls for them.

## Choose the affected pages

First identify the user or maintainer action changed, then follow it to the page that explains that action. Examples:

- Credential or connection changes: check Getting Started, CLI configuration, library configuration, and connection examples as applicable.
- CLI behavior: check the CLI reference and the guide that explains the workflow; avoid duplicating shared option definitions.
- Public API or migration behavior: check API/JSDoc examples and the version migration guide when users must change code or configuration.
- CI workflow changes: update the CI/CD guide; update README highlights only when the change is useful to readers landing on the repository.
- Release preparation: reconcile README highlights, `CHANGELOG.md`, and the migration guide with the verified release scope. Update navigation only if a page or route changes.

Do not edit every page in the map by default. Preserve accurate content and update only pages whose instructions or links are affected.

## Verify content and navigation

- Check implementation, public types, package scripts, workflow triggers, merged PRs, and issue scope before making claims.
- Keep examples executable in principle: initialize required variables, use current exports and option names, and match the documented configuration precedence.
- Use existing Jekyll link conventions and verify relative paths, front matter, page titles, and navigation after moving or adding pages.
- For release and migration text, use [CHANGELOG and migration guides](../msr-release-changelog/SKILL.md). For a GitHub draft release, use [GitHub Release notes](../msr-github-release-notes/SKILL.md); changing a draft does not authorize publishing it or creating a tag.
- Run `npm run docs:build` and `git diff --check` for documentation changes. Run code tests only when implementation or test behavior is also changed or the user asks for them.
