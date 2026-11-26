---
layout: default
title: Testing
parent: Writing Migrations
nav_order: 5
---

# Testing Migrations
{: .no_toc }

Test migration logic and Firebase database behavior before deploying changes.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Use the Firebase Realtime Database Emulator

The emulator lets integration tests exercise Firebase behavior without connecting to a production project.

The repository already includes Firebase Tools and emulator settings in its development dependencies and `firebase.json`. In another application, install Firebase Tools and initialize the Realtime Database Emulator:

```bash
npm install --save-dev firebase-tools
firebase init emulators
```

Choose Realtime Database and ensure its port matches your test configuration. This repository uses port `9000`.

Start the emulator manually with:

```bash
npm run emulator:start
```

Or run the integration test script; it starts and stops the configured emulator for the test command:

```bash
npm run test:integration
```

## Configure a Test Runner

Use an isolated project namespace and a unique `shift` so test data does not overlap. For local emulator runs, the Admin SDK still needs valid credentials; provide a test-only service-account fixture that cannot access production.

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = 'http://localhost:9000?ns=test-project';
config.applicationCredentials = './test/resources/emulator-service-account.json';
config.folder = './test/integration/migrations';
config.shift = `/test-${Date.now()}`;

const runner = await FirebaseRunner.getInstance({ config });
```

Provide a test-only service-account JSON fixture at that path; the fixture in the MSR Firebase repository is not included in the published npm package. Use a disposable project ID and credentials that cannot access production. Do not put real production credentials or data in test fixtures.

## Unit Test Pure Migration Logic

Keep transformations that do not require Firebase in pure functions. Test those with the same Mocha and Chai setup used by the repository:

```typescript
import { expect } from 'chai';

interface User {
  name: string;
  verified?: boolean;
}

function addVerifiedFlag(user: User): User {
  return { ...user, verified: user.verified ?? false };
}

describe('addVerifiedFlag', () => {
  it('preserves existing values and adds the default when missing', () => {
    expect(addVerifiedFlag({ name: 'Ada' })).to.deep.equal({
      name: 'Ada',
      verified: false
    });
    expect(addVerifiedFlag({ name: 'Grace', verified: true }).verified).to.equal(true);
  });
});
```

Use emulator integration tests for code that reads or writes Firebase paths.

## Integration Test a Migration

The repository's migrations are default-exported classes implementing `IRunnableScript<IFirebaseDB>`. Run them through `FirebaseRunner` so the test also covers discovery, validation, execution, and migration records.

```typescript
import { expect } from 'chai';
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

describe('Create users migration', () => {
  const shift = `/migration-test-${Date.now()}`;
  let config: FirebaseConfig;
  let runner: FirebaseRunner;

  before(async () => {
    config = new FirebaseConfig();
    config.databaseUrl = 'http://localhost:9000?ns=test-project';
    config.applicationCredentials = './test/resources/emulator-service-account.json';
    config.folder = './test/integration/migrations';
    config.shift = shift;
    runner = await FirebaseRunner.getInstance({ config });
  });

  after(async () => {
    await runner.getDatabase().ref(shift).remove();
  });

  it('runs migrations and writes the expected data', async () => {
    const result = await runner.up(202501010001);
    expect(result.success).to.equal(true);
    expect(result.executed).to.have.lengthOf(1);

    const users = await runner.getDatabase()
      .ref(config.buildPath('users'))
      .once('value');
    expect(users.child('user1').val().name).to.equal('Alice');
  });
});
```

Use the actual migration timestamp and test migration directory from your project. For tests that modify shared emulator state, give each test or suite a separate `shift` and remove that path during cleanup.

## Repository Test Commands

These are the current scripts in this repository's `package.json`:

| Command | What it runs |
|---|---|
| `npm run test:scripts` | Repository automation script tests. |
| `npm run test:unit` | Unit tests from `.mocharc.json`. |
| `npm run test:integration` | Firebase Emulator integration tests from `.mocharc.integration.json`. |
| `npm test` | Lint, script tests, unit tests, and integration tests. |
| `npm run test:coverage` | Unit and integration tests with coverage reporting. |

Run the complete local suite with:

```bash
npm test
```

For coverage:

```bash
npm run test:coverage
```

## CI Example

The repository's authoritative workflow is [`.github/workflows/test.yml`](https://github.com/migration-script-runner/msr-firebase/blob/master/.github/workflows/test.yml). It tests Node.js 22 and 26, installs Java 21 for Firebase Emulator, builds, runs script tests and lint, and generates unit/integration coverage.

A smaller workflow for another project can run the existing `npm test` script:

```yaml
name: Test migrations

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm test
```

## Rehearse Migrations Against a Snapshot

An empty emulator is useful for integration tests, but it may not represent the data shape found in an existing database. For a small, representative database, restore a sanitized Realtime Database JSON snapshot into a fresh emulator and run the migrations against it before deployment.

Save the snapshot as `test-data/rtdb-snapshot.json`. For example:

```json
{
  "users": {
    "user1": { "name": "Ada", "email": "ada@example.com" },
    "user2": { "name": "Grace", "email": "grace@example.com" }
  }
}
```

Add this step to a CI job after installing Node.js, Java, Firebase Tools, and the application dependencies:

```yaml
- name: Rehearse migrations against the snapshot
  run: |
    firebase emulators:exec \
      --project demo-msr-firebase \
      --only database \
      'curl --fail-with-body --silent --show-error \
         --request PUT \
         --header "Content-Type: application/json" \
         --data-binary @test-data/rtdb-snapshot.json \
         "http://127.0.0.1:9000/.json?ns=demo-msr-firebase&print=silent" && \
       export DATABASE_URL="http://127.0.0.1:9000?ns=demo-msr-firebase" && \
       export GOOGLE_APPLICATION_CREDENTIALS="./test/resources/emulator-service-account.json" && \
       npx msr-firebase validate && \
       npx msr-firebase migrate --backup-mode full'
```

`firebase emulators:exec` starts the Realtime Database Emulator, runs the command, and stops the emulator. The `PUT` restores the JSON file at the database root; it replaces the emulator's current data. The project ID and the `ns` in the emulator URL must match. Provide your own test-only service-account fixture at the path shown; the fixture in the MSR Firebase repository is not included in the published package.

The snapshot's MSR migration-history node must represent the starting release you want to test. MSR applies pending migrations, so a snapshot marked as already migrated will not run those scripts again. This rehearsal checks that the pending migrations can run against this baseline; it does not prove behavior for every possible database state.

Use only generated or sanitized snapshots. Do not commit customer data or expose it in CI logs or artifacts. If you already have a snapshot exported by Firebase Emulator Suite, you can restore that export directory with the CLI's `--import` option instead of writing a JSON fixture; see [Firebase Emulator data import and export](https://firebase.google.com/docs/emulator-suite/install_and_configure).

## Use Representative Data

Use generated fixtures or sanitized data in the emulator or an isolated non-production project. Never point these examples at production.

```json
{
  "user1": { "name": "Ada", "email": "ada@example.com" },
  "user2": { "name": "Grace", "email": "grace@example.com" }
}
```

## Performance Checks

For large migrations, use a representative dataset in the emulator or an isolated test project and measure the full runner workflow. Avoid making a test depend on a strict timing threshold that varies across machines; use performance tests to detect substantial regressions.

## Debugging

Enable a verbose logger when creating the runner:

```typescript
import { ConsoleLogger } from '@migration-script-runner/core';

const runner = await FirebaseRunner.getInstance({
  config,
  logger: new ConsoleLogger({ level: 'debug' })
});
```

For migration execution options and result handling, see [Library Usage](../library-usage/) and the [MSR Core API](https://core.migration-script-runner.dev/api/).
