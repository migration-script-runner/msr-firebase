# Contributing to MSR Firebase

Thank you for your interest in contributing. Please use GitHub Issues and pull requests for project work; do not send project support requests to personal contact details.

## Development setup

1. Install Node.js 22.13 or newer and Java 21 (needed by Firebase Emulator integration tests).
2. Clone the repository, switch to the base branch selected for your issue, and install dependencies:

   ```bash
   npm ci
   ```

3. Run the checks relevant to your change:

   ```bash
   npm run build
   npm run lint
   npm run test:unit
   npm run test:integration
   npm run docs:build
   ```

Integration tests use the Firebase Realtime Database Emulator configured by `firebase.json`; never point them at a production Firebase project. `npm test` runs lint, unit tests, and integration tests. The local pre-commit hook runs lint and unit tests, and builds the documentation when Bundler is installed. CI also runs the build and coverage checks.

## Issues and pull requests

- Search existing issues before opening a new one. Describe the expected behavior, actual behavior, and relevant reproduction steps.
- For a change tied to an issue, use the branch and target base selected for that issue. If the target branch is unclear, ask the maintainer before starting.
- Keep each pull request focused. Include tests and documentation updates when they apply, and summarize the change and validation in the PR description.
- Use a PR title in the format `#<issue number>: <imperative title>`. Link the issue through GitHub's Development field.
- Use commit messages in the format `#<issue number>: <imperative title>`, followed by a short body explaining what changed and why.
- Do not include personal email addresses or `Co-Authored-By` attribution in project commits or documentation.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security issues, follow [SECURITY.md](SECURITY.md) and do not disclose vulnerability details publicly.
