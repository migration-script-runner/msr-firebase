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

Create environment configuration:

```bash
# .env.emulator
FIREBASE_DATABASE_URL=http://localhost:9000?ns=demo-project
GOOGLE_APPLICATION_CREDENTIALS=
FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000
NODE_ENV=development
```

### Run Migrations Against Emulator

```typescript
// scripts/migrate-emulator.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function migrateEmulator() {
  // Set emulator host
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = 'http://localhost:9000?ns=demo-project';
  // No credentials needed for emulator
  appConfig.applicationCredentials = undefined;

  try {
    console.log('Running migrations against emulator...');

    const runner = await FirebaseRunner.getInstance({ config: appConfig });

    const result = await runner.migrate();

    console.log(`✓ Applied ${result.executed.length} migrations`);

    // Verify data
    const db = runner.getDatabase();
    const snapshot = await db.ref().once('value');
    console.log('\nDatabase contents:');
    console.log(JSON.stringify(snapshot.val(), null, 2));

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  }
}

migrateEmulator()
  .then(code => process.exit(code));
```

## Testing with Emulator

### Test Setup

```typescript
// test/setup.ts
import { FirebaseHandler, FirebaseConfig } from '@migration-script-runner/firebase';

export async function setupTestEnvironment() {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  const appConfig = new FirebaseConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.databaseUrl = `http://localhost:9000?ns=test-${Date.now()}`;

  const handler = await FirebaseHandler.getInstance(config);
  return { handler, config };
}

export async function cleanupTestDatabase(handler: FirebaseHandler) {
  const db = handler.db.database;
  await db.ref().set(null);
}
```

### Migration Tests

```typescript
// test/migrations.test.ts
import { expect } from 'chai';
import { FirebaseRunner } from '@migration-script-runner/firebase';
import { setupTestEnvironment, cleanupTestDatabase } from './setup';

describe('Migrations', () => {
  let handler;
  let config;
  let runner;

  before(async () => {
    const env = await setupTestEnvironment();
    handler = env.handler;
    config = env.config;
    runner = new FirebaseRunner({ handler, config });
  });

  afterEach(async () => {
    await handler.db.database.ref().set(null);
  });

  after(async () => {
    await cleanupTestDatabase(handler);
  });

  it('should apply all migrations', async () => {
    const result = await runner.migrate();

    expect(result.success).to.be.true;
    expect(result.executed.length).to.be.greaterThan(0);
  });

  it('should create users', async () => {
    await runner.migrate();

    const snapshot = await handler.db.database.ref('users').once('value');
    expect(snapshot.exists()).to.be.true;
  });

  it('should rollback correctly', async () => {
    await runner.migrate();
    await runner.down();

    const snapshot = await handler.db.database.ref('users').once('value');
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
    "test:emulator": "firebase emulators:exec --only database 'npm run test:mocha'",
    "test:mocha": "mocha --require ts-node/register 'test/**/*.test.ts'",
    "emulator:start": "firebase emulators:start --only database"
  }
}
```

### Run Tests

```bash
# Starts emulator, runs tests, stops emulator
npm run test:emulator
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
import { FirebaseHandler, FirebaseConfig } from '@migration-script-runner/firebase';
import { readFileSync } from 'fs';

async function seedEmulator() {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  const appConfig = new FirebaseConfig();
  config.databaseUrl = 'http://localhost:9000?ns=demo-project';

  const handler = await FirebaseHandler.getInstance(config);
  const db = handler.db.database;

  // Load seed data
  const seedData = JSON.parse(
    readFileSync('./test/fixtures/seed.json', 'utf-8')
  );

  await db.ref().set(seedData);

  console.log('✓ Seeded emulator with test data');
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
import { FirebaseHandler, FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { readFileSync } from 'fs';

async function testFullCycle() {
  // Setup
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  const appConfig = new FirebaseConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.databaseUrl = 'http://localhost:9000?ns=test-project';

  const runner = await FirebaseRunner.getInstance({ config: appConfig });
  const db = handler.db.database;

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
    const result = await runner.migrate();
    console.log(`✓ Applied ${result.executed.length} migrations`);

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
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run tests with emulator
        run: npm run test:emulator
```

## Docker with Emulator

### Dockerfile

```dockerfile
FROM node:20

# Install Java 21 for Firebase Emulator
RUN apt-get update && apt-get install -y openjdk-21-jre-headless

# Install Firebase Tools
RUN npm install -g firebase-tools

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy code
COPY . .

# Build
RUN npm run build

# Expose emulator ports
EXPOSE 9000 4000

# Start emulator and run tests
CMD firebase emulators:start --only database & \
    sleep 5 && \
    npm run test:emulator
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

# Import data on next start
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
  await handler.db.database.ref().set(null);
});
```

### 3. Use Unique Project IDs

```typescript
const testId = `test-${Date.now()}`;
const config = new FirebaseConfig();
config.databaseUrl = `http://localhost:9000?ns=${testId}`;
```

### 4. Environment-Specific Configuration

```typescript
// config/database.ts
import { FirebaseConfig } from '@migration-script-runner/firebase';

export function getConfig(): FirebaseConfig {
  const appConfig = new FirebaseConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';

  if (process.env.NODE_ENV === 'development') {
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
    config.databaseUrl = 'http://localhost:9000?ns=dev-project';
  } else {
    config.databaseUrl = process.env.FIREBASE_DATABASE_URL;
    config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return config;
}
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

# Or use different port in firebase.json
{
  "emulators": {
    "database": {
      "port": 9001
    }
  }
}
```

### Slow Tests

```typescript
// Reduce timeout for faster failure
this.timeout(5000);

// Use before() instead of beforeEach() for setup
before(async () => {
  // Setup once
});
```

### Java Not Found

```bash
# Install Java 21 (required for Firebase Emulator)
# macOS
brew install openjdk@21

# Ubuntu
sudo apt-get install openjdk-21-jre-headless

# Verify
java -version
```
