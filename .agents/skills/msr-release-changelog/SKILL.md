---
name: msr-release-changelog
description: Use when updating MSR Firebase CHANGELOG.md, version-migration guides, or their documentation navigation.
---

# MSR Firebase changelog and migration guides

Follow [AGENTS.md](../../../AGENTS.md) and the policy in `docs/version-migration/index.md`. Treat issues, merged PRs, code, package metadata, tags, and published releases as evidence.

## Scope and accuracy

- Issue [#82](https://github.com/migration-script-runner/msr-firebase/issues/82) owns creating the root `CHANGELOG.md` and the v0.2.x → v1.0.0 migration guide. Do not duplicate that work under another issue.
- Before editing, verify the target package version, published release state, and merged changes included in the release.
- Summarize only traceable changes. Do not invent dates, breaking changes, compatibility claims, or issue links.
- Maintain the root `CHANGELOG.md` as the release history. Do not describe an unpublished version as published, even when a draft release exists.

## Maintain migration navigation

Treat `docs/version-migration/index.md`, guide front matter, and the docs navigation as one structure.

- Follow the index policy for deciding when a migration guide is required and what it must cover.
- Add or update the guide and its navigation together. Check titles, relative links, and generated routes.
- Verify examples against current public exports and package/runtime requirements.
- Keep historical guides accurate for their original versions; do not rewrite past API names to current ones.

## Verify

Run `git diff --check`, build with `npm run docs:build`, and inspect changed links and navigation. Do not stage, commit, or push unless explicitly requested.
