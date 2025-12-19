---
layout: default
title: Basic Usage
parent: Examples
nav_order: 1
---

# Basic Usage
{: .no_toc }

Simple examples to get started with MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Minimal Example

The simplest possible setup:

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function main() {
  // Configure
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = 'https://your-project.firebaseio.com';
  appConfig.applicationCredentials = './serviceAccountKey.json';

  // Initialize runner (handler is created automatically)
  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  // Run migrations
  try {
    const result = await runner.migrate();
    console.log('Success!', result.executed.length, 'migrations applied');
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
```

## Complete Example

Full example with error handling and configuration:

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

async function runMigrations() {
  // Configure MSR Firebase
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    console.log('Initializing Firebase runner...');
    const runner = await FirebaseRunner.getInstance({ config: appConfig });

    console.log('Running migrations...');
    const result = await runner.migrate();

    console.log(`✓ Applied ${result.executed.length} migrations`);
    result.executed.forEach(m => {
      console.log(`  - ${m.name}`);
    });

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  }
}

runMigrations()
  .then(code => process.exit(code));
```

## Environment Variables

Create a `.env` file:

```bash
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
NODE_ENV=development
```

## Simple Migration File

Create your first migration:

```typescript
// migrations/1234567890-create-users.ts
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({
    user1: {
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: admin.database.ServerValue.TIMESTAMP
    },
    user2: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: admin.database.ServerValue.TIMESTAMP
    }
  });

  console.log('✓ Created users');
};

export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  await db.ref('users').remove();
  console.log('✓ Removed users');
};
```

## List Migrations

Check migration status:

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function listMigrations() {
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  const statuses = await runner.list();

  console.log('Migration Status:');
  console.log('─'.repeat(60));

  statuses.forEach(status => {
    const icon = status.status === 'executed' ? '✓' : '○';
    const date = status.executedAt
      ? new Date(status.executedAt).toISOString()
      : 'Not applied';

    console.log(`${icon} ${status.name}`);
    console.log(`  Status: ${status.status}`);
    console.log(`  Applied: ${date}`);
    console.log();
  });
}

listMigrations();
```

## Rollback Example

Roll back the last migration:

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function rollback() {
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    console.log('Rolling back last migration...');

    const result = await runner.down();

    console.log(`✓ Rolled back ${result.executed.length} migrations`);

    return 0;
  } catch (error) {
    console.error('Rollback failed:', error);
    return 1;
  }
}

rollback()
  .then(code => process.exit(code));
```

## Backup and Restore

Create and restore backups:

```typescript
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function backupAndRestore() {
  const appConfig = new AppConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    // Create backup
    console.log('Creating backup...');
    const backupPath = await runner.backup();
    console.log('✓ Backup created:', backupPath);

    // Run migrations
    console.log('\nRunning migrations...');
    await runner.migrate();

    // Optional: Restore from backup
    // await runner.restore(backupPath);

    return 0;
  } catch (error) {
    console.error('Operation failed:', error);
    return 1;
  }
}

backupAndRestore()
  .then(code => process.exit(code));
```

## Configuration with Locking

Enable migration locking for production:

```typescript
import { FirebaseHandler, FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

async function runWithLocking() {
  const config = new AppConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Enable locking for production
  config.locking = {
    enabled: process.env.NODE_ENV === 'production',
    timeout: 600000,  // 10 minutes
    retryAttempts: 3,
    retryDelay: 5000   // 5 seconds
  };

  const handler = await FirebaseHandler.getInstance(config);
  const runner = new FirebaseRunner({ handler, config });

  try {
    const result = await runner.migrate();
    console.log(`✓ Applied ${result.executed.length} migrations`);
    return 0;
  } catch (error) {
    if (error.message.includes('lock')) {
      console.error('Another migration is running. Please wait or use: npx msr-firebase lock:release --force');
    } else {
      console.error('Migration failed:', error);
    }
    return 1;
  }
}

runWithLocking()
  .then(code => process.exit(code));
```

## TypeScript Configuration

Recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": [
    "migrations/**/*",
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## Package.json Scripts

Useful npm scripts:

```json
{
  "scripts": {
    "migrate": "ts-node -r dotenv/config src/migrate.ts",
    "migrate:down": "ts-node -r dotenv/config src/rollback.ts",
    "migrate:list": "ts-node -r dotenv/config src/list.ts",
    "migrate:backup": "ts-node -r dotenv/config src/backup.ts"
  },
  "dependencies": {
    "@migration-script-runner/firebase": "^0.2.0",
    "firebase-admin": "^11.11.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

## See Also

- [CLI Usage](with-cli) - Using the CLI interface
- [Firebase Emulator](firebase-emulator) - Testing with emulator
- [Getting Started](../getting-started) - Quick start guide
