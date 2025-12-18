---
layout: default
title: Custom Commands
parent: Examples
nav_order: 3
---

# Custom Commands
{: .no_toc }

Examples of creating custom migration commands and scripts.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Custom Migration Script

Create a custom script with specific behavior:

```typescript
// scripts/migrate-with-notification.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

// Custom notification function
async function sendNotification(message: string) {
  // Send to Slack, email, etc.
  console.log('📧 Notification:', message);
}

async function migrateWithNotification() {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY!),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  try {
    await sendNotification('Starting database migrations...');

    const result = await runner.migrate();

    const message = `✓ Successfully applied ${result.appliedMigrations.length} migrations:\n` +
      result.appliedMigrations.map(m => `  - ${m.name}`).join('\n');

    await sendNotification(message);

    return 0;
  } catch (error) {
    await sendNotification(`✗ Migration failed: ${error}`);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

migrateWithNotification()
  .then(code => process.exit(code));
```

## Migration with Validation

Custom script with pre-flight checks:

```typescript
// scripts/safe-migrate.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

async function safeMigrate() {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY!),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations',
    config: {
      rollbackStrategy: 'backup',
      validateChecksums: true
    }
  });

  try {
    // Step 1: Validate
    console.log('1. Validating migrations...');
    const validation = await runner.validate();

    if (!validation.valid) {
      console.error('✗ Validation failed:');
      validation.errors.forEach(e => console.error(`  - ${e.message}`));
      return 1;
    }
    console.log('✓ Validation passed');

    // Step 2: List pending
    console.log('\n2. Checking pending migrations...');
    const statuses = await runner.list();
    const pending = statuses.filter(s => s.status === 'pending');

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return 0;
    }

    console.log(`Found ${pending.length} pending migrations:`);
    pending.forEach(m => console.log(`  - ${m.name}`));

    // Step 3: Backup
    console.log('\n3. Creating backup...');
    const backup = await runner.backup();
    console.log(`✓ Backup created: ${backup.backupId}`);

    // Step 4: Migrate
    console.log('\n4. Applying migrations...');
    const result = await runner.migrate();

    console.log(`✓ Successfully applied ${result.appliedMigrations.length} migrations`);

    return 0;
  } catch (error) {
    console.error('✗ Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

safeMigrate()
  .then(code => process.exit(code));
```

## Selective Migration

Migrate only specific migrations:

```typescript
// scripts/migrate-specific.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

async function migrateSpecific(timestamps: number[]) {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY!),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  try {
    const statuses = await runner.list();

    // Filter to only specified migrations
    const toMigrate = statuses.filter(s =>
      timestamps.includes(s.timestamp) && s.status === 'pending'
    );

    if (toMigrate.length === 0) {
      console.log('No matching pending migrations found');
      return 0;
    }

    console.log('Migrations to apply:');
    toMigrate.forEach(m => console.log(`  - ${m.name}`));

    // Migrate to each timestamp
    for (const migration of toMigrate) {
      console.log(`\nApplying: ${migration.name}...`);
      await runner.migrate({ to: migration.timestamp });
      console.log('✓ Done');
    }

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

// Usage: ts-node scripts/migrate-specific.ts 1234567890 1234567891
const timestamps = process.argv.slice(2).map(Number);
migrateSpecific(timestamps)
  .then(code => process.exit(code));
```

## Interactive Migration

Prompt user for confirmation:

```typescript
// scripts/interactive-migrate.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';
import * as readline from 'readline';

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function interactiveMigrate() {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY!),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  try {
    // Show pending migrations
    const statuses = await runner.list();
    const pending = statuses.filter(s => s.status === 'pending');

    if (pending.length === 0) {
      console.log('No pending migrations');
      return 0;
    }

    console.log(`\nFound ${pending.length} pending migrations:`);
    pending.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name}`);
    });

    // Ask for confirmation
    const answer = await askQuestion('\nApply these migrations? (y/N): ');

    if (answer.toLowerCase() !== 'y') {
      console.log('Migration cancelled');
      return 0;
    }

    // Apply migrations
    console.log('\nApplying migrations...');
    const result = await runner.migrate();

    console.log(`✓ Successfully applied ${result.appliedMigrations.length} migrations`);

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

interactiveMigrate()
  .then(code => process.exit(code));
```

## Migration with Metrics

Track migration performance:

```typescript
// scripts/migrate-with-metrics.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

interface MigrationMetrics {
  name: string;
  duration: number;
  success: boolean;
}

async function migrateWithMetrics() {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY!),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  const metrics: MigrationMetrics[] = [];

  try {
    const statuses = await runner.list();
    const pending = statuses.filter(s => s.status === 'pending');

    for (const migration of pending) {
      const startTime = Date.now();

      try {
        await runner.migrate({ to: migration.timestamp });

        metrics.push({
          name: migration.name,
          duration: Date.now() - startTime,
          success: true
        });
      } catch (error) {
        metrics.push({
          name: migration.name,
          duration: Date.now() - startTime,
          success: false
        });
        throw error;
      }
    }

    // Print metrics
    console.log('\n📊 Migration Metrics:');
    console.log('─'.repeat(60));

    metrics.forEach(m => {
      const status = m.success ? '✓' : '✗';
      const duration = (m.duration / 1000).toFixed(2);
      console.log(`${status} ${m.name}: ${duration}s`);
    });

    const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
    console.log('─'.repeat(60));
    console.log(`Total: ${(totalTime / 1000).toFixed(2)}s`);

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

migrateWithMetrics()
  .then(code => process.exit(code));
```

## Parallel Testing

Test migrations in parallel against emulator:

```typescript
// scripts/parallel-test.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

async function testMigration(
  projectId: string,
  migrationsPath: string
): Promise<boolean> {
  // Initialize separate app for this test
  const app = admin.initializeApp(
    {
      projectId,
      databaseURL: `http://localhost:9000?ns=${projectId}`
    },
    projectId // Unique app name
  );

  const runner = new FirebaseRunner({
    db: app.database(),
    migrationsPath
  });

  try {
    await runner.migrate();
    return true;
  } catch (error) {
    console.error(`Test failed for ${projectId}:`, error);
    return false;
  } finally {
    await app.delete();
  }
}

async function parallelTest() {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  const testCases = [
    { projectId: 'test-1', path: './migrations' },
    { projectId: 'test-2', path: './migrations' },
    { projectId: 'test-3', path: './migrations' }
  ];

  console.log(`Running ${testCases.length} parallel tests...`);

  const results = await Promise.all(
    testCases.map(tc => testMigration(tc.projectId, tc.path))
  );

  const passed = results.filter(r => r).length;
  const failed = results.length - passed;

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  return failed === 0 ? 0 : 1;
}

parallelTest()
  .then(code => process.exit(code));
```

## Add to package.json

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate-with-notification.ts",
    "migrate:safe": "ts-node scripts/safe-migrate.ts",
    "migrate:specific": "ts-node scripts/migrate-specific.ts",
    "migrate:interactive": "ts-node scripts/interactive-migrate.ts",
    "migrate:metrics": "ts-node scripts/migrate-with-metrics.ts",
    "test:parallel": "ts-node scripts/parallel-test.ts"
  }
}
```

## Usage

```bash
# Safe migration with validation
npm run migrate:safe

# Interactive migration
npm run migrate:interactive

# Migrate specific migrations
npm run migrate:specific 1234567890 1234567891

# Migration with performance metrics
npm run migrate:metrics

# Parallel testing
npm run test:parallel
```

## See Also

- [Basic Usage](basic-usage) - Simple examples
- [CLI Examples](with-cli) - CLI usage
- [Writing Migrations](../guides/writing-migrations) - Migration patterns
