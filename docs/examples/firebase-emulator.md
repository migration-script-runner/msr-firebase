---
layout: default
title: Firebase Emulator
parent: Examples
nav_order: 4
---

# Firebase Emulator
{: .no_toc }

Running and testing migrations with Firebase Local Emulator Suite.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Setup Firebase Emulator

### Install Firebase Tools

```bash
npm install -g firebase-tools
```

### Initialize Emulator

```bash
firebase init emulators
```

Select:
- ✓ Realtime Database
- (Optional) ✓ Emulator UI

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
┌─────────────────────────────────────────────────────────┐
│ ✔  All emulators ready!                                │
│                                                         │
│ View Emulator UI at http://localhost:4000              │
└─────────────────────────────────────────────────────────┘
```

## Basic Usage with Emulator

### Configure for Emulator

```typescript
// config/emulator.ts
import * as admin from 'firebase-admin';

export function initializeEmulator() {
  // Set emulator host
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  admin.initializeApp({
    projectId: 'demo-project',
    databaseURL: 'http://localhost:9000?ns=demo-project'
  });

  return admin.database();
}
```

### Run Migrations Against Emulator

```typescript
// scripts/migrate-emulator.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import { initializeEmulator } from '../config/emulator';

async function migrateEmulator() {
  const db = initializeEmulator();

  const runner = new FirebaseRunner({
    db,
    migrationsPath: './migrations'
  });

  try {
    console.log('Running migrations against emulator...');

    const result = await runner.migrate();

    console.log(`✓ Applied ${result.appliedMigrations.length} migrations`);

    // Verify data
    const snapshot = await db.ref().once('value');
    console.log('\nDatabase contents:');
    console.log(JSON.stringify(snapshot.val(), null, 2));

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

migrateEmulator()
  .then(code => process.exit(code));
```

## Testing with Emulator

### Test Setup

```typescript
// test/setup.ts
import * as admin from 'firebase-admin';

export function setupTestDatabase() {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  admin.initializeApp({
    projectId: 'test-project',
    databaseURL: 'http://localhost:9000?ns=test-project'
  });

  return admin.database();
}

export async function cleanupTestDatabase() {
  const db = admin.database();
  await db.ref().set(null);
  await admin.app().delete();
}
```

### Migration Tests

```typescript
// test/migrations.test.ts
import { expect } from 'chai';
import { FirebaseRunner } from '@migration-script-runner/firebase';
import { setupTestDatabase, cleanupTestDatabase } from './setup';

describe('Migrations', () => {
  let db: admin.database.Database;
  let runner: FirebaseRunner;

  before(() => {
    db = setupTestDatabase();
    runner = new FirebaseRunner({
      db,
      migrationsPath: './migrations'
    });
  });

  afterEach(async () => {
    await db.ref().set(null);
  });

  after(async () => {
    await cleanupTestDatabase();
  });

  it('should apply all migrations', async () => {
    const result = await runner.migrate();

    expect(result.status).to.equal('success');
    expect(result.appliedMigrations.length).to.be.greaterThan(0);
  });

  it('should create users', async () => {
    await runner.migrate();

    const snapshot = await db.ref('users').once('value');
    expect(snapshot.exists()).to.be.true;
  });

  it('should rollback correctly', async () => {
    await runner.migrate();
    await runner.down();

    const snapshot = await db.ref('users').once('value');
    expect(snapshot.exists()).to.be.false;
  });
});
```

## Running Tests Automatically

### npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "test": "firebase emulators:exec --only database 'npm run test:mocha'",
    "test:mocha": "mocha --require ts-node/register 'test/**/*.test.ts'",
    "test:watch": "firebase emulators:exec --only database 'npm run test:mocha:watch'",
    "test:mocha:watch": "mocha --require ts-node/register --watch 'test/**/*.test.ts'"
  }
}
```

### Run Tests

```bash
# Starts emulator, runs tests, stops emulator
npm test
```

## Emulator with Seeded Data

### Create Seed Data

```json
// test/fixtures/seed.json
{
  "users": {
    "user1": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "user2": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  },
  "posts": {
    "post1": {
      "title": "First Post",
      "author": "user1"
    }
  }
}
```

### Load Seed Data

```typescript
// scripts/seed-emulator.ts
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

async function seedEmulator() {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  admin.initializeApp({
    projectId: 'demo-project',
    databaseURL: 'http://localhost:9000?ns=demo-project'
  });

  const db = admin.database();

  // Load seed data
  const seedData = JSON.parse(
    readFileSync('./test/fixtures/seed.json', 'utf-8')
  );

  await db.ref().set(seedData);

  console.log('✓ Seeded emulator with test data');

  await admin.app().delete();
}

seedEmulator();
```

### Use with Emulator

```bash
# Start emulator
firebase emulators:start --only database &

# Seed data
ts-node scripts/seed-emulator.ts

# Run migrations
ts-node scripts/migrate-emulator.ts
```

## Automated Emulator Workflow

### Complete Test Script

```typescript
// scripts/test-full-cycle.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

async function testFullCycle() {
  // Setup
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  admin.initializeApp({
    projectId: 'test-project',
    databaseURL: 'http://localhost:9000?ns=test-project'
  });

  const db = admin.database();

  try {
    // 1. Seed initial data
    console.log('1. Loading seed data...');
    const seedData = JSON.parse(
      readFileSync('./test/fixtures/seed.json', 'utf-8')
    );
    await db.ref().set(seedData);
    console.log('✓ Seed data loaded');

    // 2. Run migrations
    console.log('\n2. Running migrations...');
    const runner = new FirebaseRunner({
      db,
      migrationsPath: './migrations'
    });
    const result = await runner.migrate();
    console.log(`✓ Applied ${result.appliedMigrations.length} migrations`);

    // 3. Verify data
    console.log('\n3. Verifying data...');
    const snapshot = await db.ref().once('value');
    const data = snapshot.val();

    if (!data.users) {
      throw new Error('Users not found');
    }
    console.log('✓ Data verified');

    // 4. Test rollback
    console.log('\n4. Testing rollback...');
    await runner.down();
    console.log('✓ Rollback successful');

    // 5. Re-apply migrations
    console.log('\n5. Re-applying migrations...');
    await runner.migrate();
    console.log('✓ Migrations re-applied');

    console.log('\n✓ Full cycle test passed!');
    return 0;
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

testFullCycle()
  .then(code => process.exit(code));
```

## CI/CD with Emulator

### GitHub Actions

```yaml
name: Test with Emulator

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

      - name: Run tests with emulator
        run: npm test
```

## Docker with Emulator

### Dockerfile

```dockerfile
FROM node:18

# Install Firebase Tools
RUN npm install -g firebase-tools

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy code
COPY . .

# Expose emulator ports
EXPOSE 9000 4000

# Start emulator and run tests
CMD firebase emulators:start --only database & \
    sleep 5 && \
    npm test
```

### Build and Run

```bash
docker build -t firebase-migrations-test .
docker run -p 9000:9000 -p 4000:4000 firebase-migrations-test
```

## Emulator UI Access

### View Database in Browser

```bash
# Start emulator with UI
firebase emulators:start --only database

# Open browser to:
# http://localhost:4000
```

### Export Emulator Data

```bash
# Export all data
firebase emulators:export ./emulator-data

# Import data
firebase emulators:start --import ./emulator-data
```

## Best Practices

### 1. Always Use Emulator for Development

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
}
```

### 2. Clear Data Between Tests

```typescript
afterEach(async () => {
  await db.ref().set(null);
});
```

### 3. Use Unique Project IDs

```typescript
const testId = `test-${Date.now()}`;
admin.initializeApp({
  projectId: testId,
  databaseURL: `http://localhost:9000?ns=${testId}`
});
```

### 4. Test Against Production-Like Data

```bash
# Export production data (anonymized)
firebase database:get / > prod-data.json

# Import to emulator
ts-node scripts/import-to-emulator.ts prod-data.json
```

## Troubleshooting

### Emulator Connection Refused

```bash
# Check if emulator is running
curl http://localhost:9000

# Restart emulator
firebase emulators:start --only database
```

### Port Already in Use

```bash
# Find process using port 9000
lsof -i :9000

# Kill process
kill -9 <PID>

# Or use different port
firebase emulators:start --only database --config firebase.json
```

### Slow Tests

```typescript
// Reduce timeout for faster failure
this.timeout(5000);

// Use beforeAll instead of beforeEach
before(async () => {
  // Setup once
});
```

## See Also

- [Testing Guide](../guides/testing) - Testing strategies
- [Basic Usage](basic-usage) - Simple examples
- [Custom Commands](custom-commands) - Custom scripts
