---
layout: default
title: Testing
parent: Guides
nav_order: 6
---

# Testing
{: .no_toc }

How to test your migrations with Firebase emulator and testing frameworks.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Firebase Emulator Setup

### Install Firebase Tools

```bash
npm install -g firebase-tools
```

### Initialize Firebase Emulator

```bash
firebase init emulators
```

Select:
- ✓ Realtime Database

### Configure Emulator

Edit `firebase.json`:

```json
{
  "emulators": {
    "database": {
      "port": 9000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Start Emulator

```bash
firebase emulators:start --only database
```

**Output:**
```
✔  database: Emulator started at http://localhost:9000
✔  All emulators ready!

View Emulator UI at http://localhost:4000
```

## Testing Migrations with Emulator

### Configure for Emulator

```typescript
// test-config.ts
import * as admin from 'firebase-admin';

export function initializeTestDatabase() {
  // Use emulator
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  admin.initializeApp({
    projectId: 'test-project',
    databaseURL: 'http://localhost:9000?ns=test-project'
  });

  return admin.database();
}
```

### Run Migrations Against Emulator

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function testMigrations() {
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = 'http://localhost:9000';  // Emulator
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  // Run migrations
  const result = await runner.migrate();
  console.log('Migrations applied:', result.executed.length);

  // Verify data
  const db = runner.getDatabase();
  const snapshot = await db.ref('users').once('value');
  console.log('Users created:', snapshot.numChildren());
}

testMigrations();
```

## Unit Testing Migrations

### Setup with Mocha/Chai

```bash
npm install --save-dev mocha chai @types/mocha @types/chai
```

### Test Structure

```typescript
// test/migrations/001-create-users.test.ts
import { expect } from 'chai';
import * as admin from 'firebase-admin';
import { up, down } from '../../migrations/001-create-users';

describe('Migration 001: Create Users', () => {
  let db: admin.database.Database;

  before(() => {
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
    admin.initializeApp({
      projectId: 'test-project',
      databaseURL: 'http://localhost:9000?ns=test-project'
    });
    db = admin.database();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.ref().set(null);
  });

  after(async () => {
    await admin.app().delete();
  });

  describe('up()', () => {
    it('should create users node', async () => {
      await up(db);

      const snapshot = await db.ref('users').once('value');
      expect(snapshot.exists()).to.be.true;
    });

    it('should create user1', async () => {
      await up(db);

      const snapshot = await db.ref('users/user1').once('value');
      const user = snapshot.val();

      expect(user).to.exist;
      expect(user.name).to.equal('John Doe');
      expect(user.email).to.equal('john@example.com');
    });
  });

  describe('down()', () => {
    it('should remove users node', async () => {
      await up(db);
      await down(db);

      const snapshot = await db.ref('users').once('value');
      expect(snapshot.exists()).to.be.false;
    });
  });
});
```

### Run Tests

```bash
# Start emulator
firebase emulators:start --only database

# Run tests (in another terminal)
npm test
```

## Integration Testing

### Full Migration Flow Test

```typescript
// test/integration/migration-flow.test.ts
import { expect } from 'chai';
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

describe('Migration Flow', () => {
  let runner: FirebaseRunner;
  let db: admin.database.Database;

  before(async () => {
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
    admin.initializeApp({
      projectId: 'test-project',
      databaseURL: 'http://localhost:9000?ns=test-project'
    });

    const appConfig = new AppConfig();
    appConfig.folder = './migrations';
    appConfig.tableName = 'schema_version';
    appConfig.databaseUrl = 'http://localhost:9000?ns=test-project';

    runner = await FirebaseRunner.getInstance({ config: appConfig });
    db = runner.getDatabase();
  });

  afterEach(async () => {
    // Reset database
    await db.ref().set(null);

    // Reset migrations
    await runner.down({ to: 0 });
  });

  after(async () => {
    await admin.app().delete();
  });

  it('should apply all migrations', async () => {
    const result = await runner.migrate();

    expect(result.status).to.equal('success');
    expect(result.appliedMigrations.length).to.be.greaterThan(0);
  });

  it('should rollback migrations', async () => {
    await runner.migrate();

    const result = await runner.down();

    expect(result.status).to.equal('success');
  });

  it('should list migration status', async () => {
    await runner.migrate();

    const statuses = await runner.list();

    expect(statuses).to.be.an('array');
    expect(statuses.every(s => s.status === 'applied')).to.be.true;
  });
});
```

## Testing Best Practices

### 1. Use Fresh Database for Each Test

```typescript
afterEach(async () => {
  await db.ref().set(null);
});
```

### 2. Test Both Up and Down

```typescript
describe('Migration', () => {
  it('should apply migration', async () => {
    await up(db);
    // Assertions...
  });

  it('should rollback migration', async () => {
    await up(db);
    await down(db);
    // Verify rollback...
  });
});
```

### 3. Test Edge Cases

```typescript
it('should handle empty database', async () => {
  await up(db);
  // Migration should handle missing data gracefully
});

it('should be idempotent', async () => {
  await up(db);
  await up(db); // Run twice

  // Should produce same result
  const snapshot = await db.ref('users').once('value');
  expect(snapshot.numChildren()).to.equal(1);
});
```

### 4. Verify Data Integrity

```typescript
it('should maintain data relationships', async () => {
  await up(db);

  const user = await db.ref('users/user1').once('value');
  const postAuthor = await db.ref('posts/post1/authorId').once('value');

  expect(postAuthor.val()).to.equal('user1');
});
```

## Automated Testing with npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "firebase emulators:exec --only database 'npm run test:mocha'",
    "test:mocha": "mocha --require ts-node/register 'test/**/*.test.ts'",
    "test:watch": "mocha --require ts-node/register --watch 'test/**/*.test.ts'"
  }
}
```

Run tests:
```bash
npm test
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Migrations

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Firebase Tools
        run: npm install -g firebase-tools

      - name: Run tests
        run: npm test
```

## Testing with Real Data

### Create Test Fixtures

```typescript
// test/fixtures/users.json
{
  "user1": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "user2": {
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

### Load Fixtures

```typescript
import { readFileSync } from 'fs';

beforeEach(async () => {
  const fixtures = JSON.parse(
    readFileSync('./test/fixtures/users.json', 'utf-8')
  );

  await db.ref('users').set(fixtures);
});
```

## Performance Testing

### Measure Migration Time

```typescript
it('should complete migration within 5 seconds', async function() {
  this.timeout(5000);

  const start = Date.now();
  await runner.migrate();
  const duration = Date.now() - start;

  expect(duration).to.be.lessThan(5000);
});
```

### Test Large Datasets

```typescript
it('should handle 10000 records', async function() {
  this.timeout(30000);

  // Create large dataset
  const updates: Record<string, any> = {};
  for (let i = 0; i < 10000; i++) {
    updates[`users/user${i}`] = { name: `User ${i}` };
  }
  await db.ref().update(updates);

  // Run migration
  await up(db);

  // Verify
  const snapshot = await db.ref('users').once('value');
  expect(snapshot.numChildren()).to.equal(10000);
});
```

## Debugging Tests

### Enable Verbose Logging

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';
import { ConsoleLogger } from '@migration-script-runner/core';

const appConfig = new AppConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = 'http://localhost:9000';

const runner = await FirebaseRunner.getInstance({
  config: appConfig,
  logger: new ConsoleLogger({ level: 'debug' })
});
```

### Inspect Database State

```typescript
afterEach(async () => {
  // Dump database state for debugging
  const snapshot = await db.ref().once('value');
  console.log('Database state:', JSON.stringify(snapshot.val(), null, 2));
});
```

## See Also

- [Writing Migrations](writing-migrations) - Migration best practices
- [Firebase-Specific Features](firebase-specific) - Firebase patterns
- [Examples](../examples/) - Code examples
