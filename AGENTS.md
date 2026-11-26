# Agent Guidance

These instructions apply to this repository. Prefer checked-in code, configuration, and documentation as sources of truth; verify version-sensitive details before changing them.

## Project Overview

MSR Firebase is the Firebase Realtime Database adapter for MSR Core. The package is `@migration-script-runner/firebase`, written in TypeScript. Check `package.json`, the installed Core package, and its source for the current Core version and API; do not copy API names from memory or assume a Core version is compatible.

Use Firebase Admin's modular imports, such as `Database` and `getDatabase` from `firebase-admin/database`. Avoid `any` and double assertions such as `as unknown as`; keep Firebase and Core types explicit.

## Source of Truth and Repository Map

- `package.json`: Node requirement, package version, scripts, and dependency declarations.
- `package-lock.json`: locked npm dependency graph; keep it in sync with `package.json`.
- `.nvmrc`: local Node major version.
- `.github/workflows/test.yml`, `pr-validation.yml`, `security.yml`, and `docs.yml`: CI checks and supported runtime behavior. Check any remaining legacy CI configuration directly before relying on it.
- `.github/workflows/npm-publish.yml`: npm publishing trigger and steps.
- `.husky/pre-commit`: local checks run before commits.
- `.nycrc`: coverage thresholds and report configuration.
- `firebase.json`: Firebase Emulator ports and configuration.
- `src/`: adapter implementation; `test/unit/` and `test/integration/`: tests.
- `docs/`: Jekyll documentation. `docs/version-migration/index.md` defines when migration guides are needed and what they contain.
- `README.md`: user-facing overview and current release highlights.
- `CHANGELOG.md`: release history; verify entries against merged issues and package metadata.

Check these files directly before relying on a command, threshold, API name, CI rule, release version, or path.

## Architecture

- `src/FirebaseRunner.ts` exposes the adapter runner and delegates migration lifecycle to MSR Core.
- `src/service/FirebaseHandler.ts` implements Core's handler contract and composes Firebase-specific services.
- `src/service/FirebaseDB.ts` wraps the Admin SDK `Database` with the adapter's `IFirebaseDB` contract; `src/service/DBConnector.ts` initializes the Firebase app and database.
- `src/service/` contains backup, locking, migration-data, schema-version, and entity services. `src/model/FirebaseConfig.ts` owns Firebase-specific configuration.
- `src/cli.ts` connects the Firebase runner to the Core CLI.
- Check the installed Core version and source before changing integration points.

## Runtime and Commands

The current package requires Node.js `>=22.13.0`; `.nvmrc` selects Node 22. CI tests Node 22.x and 26.x and installs Java 21 for Firebase Emulator work.

- `npm ci`: clean dependency installation.
- `npm run build`: remove `dist`, compile TypeScript, remove compiled tests.
- `npm run lint`: lint `src/`.
- `npm run test:unit`: unit tests.
- `npm run test:integration`: integration tests against the Firebase Realtime Database Emulator.
- `npm test`: lint, repository-script tests, unit tests, then integration tests.
- `npm run test:coverage`: unit and integration coverage using the standard `.nycrc` thresholds (80% lines, functions, and statements; 70% branches). CI uses this command.
- `npm run test:coverage:strict`: unit and integration coverage with 100% required for lines, functions, statements, and branches. The pre-commit hook uses this stricter local check; it does not change CI's standard thresholds.
- `npm run docs:build`: build the Jekyll documentation site.
- `npm run docs:serve`: serve the documentation locally.

Never run integration tests against a production Firebase project. Use the emulator configured in `firebase.json` (database port 9000). The pre-commit hook runs lint and strict unit/integration coverage, then builds docs if Bundler is installed. CI uses the standard coverage thresholds.

## Change Expectations

- Make the smallest change that satisfies the task.
- Update tests for behavior changes and relevant docs for user-visible changes.
- Check existing implementation and docs before introducing or renaming APIs.
- Do not claim coverage, security, compatibility, or release facts without current evidence.
- Keep support routes in GitHub Issues; do not add personal email addresses.
- Avoid editing generated output such as `dist/`, `docs/_site/`, reports, or `node_modules/`.

## Code, Tests, and Documentation

For code changes, follow the complete work pattern:

1. Update the implementation.
2. Add or update tests for changed behavior and important failure paths.
3. Update the relevant documentation when public APIs, configuration, CLI behavior, or user-visible behavior changes.

Before deciding docs do not need an update, check the README and relevant guides/API pages. For internal-only changes, state why user-facing docs are unaffected.

### Architecture and API consistency

- Keep Core-owned migration lifecycle behavior in Core. Implement Firebase-specific database behavior in focused Firebase services and use the installed Core contracts.
- Keep connection setup, configuration, persistence, locking, backup, and migration-data concerns separate where the existing architecture does so.
- Follow the source's JSDoc style for new or changed public APIs. Verify public signatures and examples against the package exports.

### Code quality

- Avoid `any` and double type assertions such as `as unknown as`. Model the real Firebase Admin and Core contracts instead.
- Use `node:` imports for Node.js built-in modules.
- Mark fields and values `readonly` when they are not reassigned.
- Keep functions focused; split complex branching into named helpers where that makes behavior easier to verify. Prefer early returns and positive conditions when they make control flow clearer; avoid nested template literals.
- Use specific error classes for invalid types or out-of-range values; retain clear messages for operational failures.
- Document new or changed public APIs in the existing JSDoc style, including purpose and relevant parameter, return, and error details.
- For broad renames or API changes, search the whole repository before editing, track the relevant occurrences, and repeat the search afterward to verify completion.

### Test standards

- Every test should assert an observable result or interaction. Do not add tests that merely execute code.
- Prefer behavior-focused tests over assertions on private implementation details. Mock only boundaries needed by the test; build complete typed fixtures instead of casting individual properties.
- Validate the expected error type and useful message for failure cases.
- Keep unit tests separate from Firebase Emulator integration tests. Never point integration tests at production.
- The standard `.nycrc` thresholds are 80% for lines, functions, and statements and 70% for branches; preserve these CI thresholds unless a dedicated issue changes the policy. The local pre-commit hook separately enforces 100% across all four metrics through `npm run test:coverage:strict`.
- The pre-commit hook runs lint, strict unit/integration coverage, and may build docs when Bundler is installed. CI runs build and coverage with the standard `.nycrc` thresholds; check the current workflow before describing enforcement.

### Documentation standards

- Keep public examples aligned with current exports, package metadata, and installed Core/Firebase Admin APIs.
- When changing a public interface, include before/after migration guidance where users must change their code.
- Validate relative links and navigation after editing docs. Build the Jekyll site with `npm run docs:build` for documentation changes.
- Do not copy version-specific Core examples from another repository without checking the installed package or the migration issue.

### Issue creation

- Search open and closed issues before creating a ticket; update an existing issue instead of duplicating its scope.
- For new issues, use the repository's existing Type, Priority, and Test labels, assign vlavrynovych, and set the appropriate milestone. Confirm each label exists before applying it.
- Keep issue scope, acceptance criteria, and dependencies explicit. Link related tickets rather than silently combining unrelated work.

## Release Planning

For each versioned release milestone, maintain one code review issue and one documentation review issue. Confirm existing open and closed issues before creating either; keep both assigned to the milestone and use the repository's established labels. For v1.0.0, [#84](https://github.com/migration-script-runner/msr-firebase/issues/84) and [#85](https://github.com/migration-script-runner/msr-firebase/issues/85) are the respective review tickets.

## Git and GitHub Workflow

- Work in this repository directory. Do not move project work into a Codex worktree or another checkout unless the user explicitly requests it.
- Run `gh` from the project directory, not from a sandbox, temporary directory, or worktree. Check `gh auth status --hostname github.com` there. If CLI authentication is unavailable, use the connected GitHub integration when it supports the requested operation; do not ask for reauthentication before checking that option.
- Never commit, push, open/update a PR, or mutate issues unless the user explicitly asks.
- Before starting an issue, read its full description and comments; check its state, labels, assignee, milestone, available branches, and current remote default branch. Inspect related issues for overlap, prerequisites, and stale scope.
- Follow the v1.0.0 dependency sequence in [#90](https://github.com/migration-script-runner/msr-firebase/issues/90). If another release has many open tasks but no clear order, recommend a planning issue instead of silently duplicating scope.
- Use issue branches named `issue/<number>-<short-kebab-title>`. Choose the base branch from the issue's release plan and existing branches; do not infer a release branch merely from a milestone. If the intended base is unclear, ask before branching.
- Commit messages use `#<issue>: <imperative title>`, followed by a body that explains what changed and why. Do not add AI attribution.
- For ticket-scoped PRs, use a concise `#<issue>: <title>` title. Mirror the issue's assignee, labels, and milestone on the PR.
- Link the issue through the PR's **Development** field. Do not put `Closes #<number>` or equivalent in the PR description. Verify the issue shows the connected PR before finishing.
- Close an issue only after the related PR has merged and the user has asked to close it; add a concise completion comment when requested.

## Release Conventions

- `package.json` is the source of truth for the package version. Check GitHub tags and releases before preparing a new version.
- The npm publish workflow runs for `v*` tags and manual dispatch; `prepublishOnly` runs build, lint, and unit tests. Do not create tags, publish packages, or publish GitHub releases without an explicit request.
- Follow `docs/version-migration/index.md` when deciding whether a migration guide is required. Keep its index/navigation synchronized with any new guide.
- Use the [GitHub Release notes skill](.agents/skills/msr-github-release-notes/SKILL.md) for release text and README highlights, and the [CHANGELOG and migration guide skill](.agents/skills/msr-release-changelog/SKILL.md) for those documentation files.

## Project Skills

Use the local procedures when their descriptions match the task:

- [Commit workflow](.agents/skills/msr-commit-workflow/SKILL.md)
- [GitHub issues and PRs](.agents/skills/msr-github-pr/SKILL.md)
- [GitHub Release notes](.agents/skills/msr-github-release-notes/SKILL.md)
- [CHANGELOG and migration guides](.agents/skills/msr-release-changelog/SKILL.md)
- [SonarCloud reports](.agents/skills/msr-sonar-report/SKILL.md)
