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
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

// Create runner
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations'
});

// Run migrations
runner.migrate()
  .then(result => {
    console.log('Success!', result.appliedMigrations);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
```

## Complete Example

Full example with error handling and configuration:

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

async function runMigrations() {
  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations',
    config: {
      rollbackStrategy: 'backup',
      validateChecksums: true,
      backupPath: './backups'
    }
  });

  try {
    console.log('Running migrations...');

    // Apply migrations
    const result = await runner.migrate();

    console.log(`✓ Applied ${result.appliedMigrations.length} migrations`);
    result.appliedMigrations.forEach(m => {
      console.log(`  - ${m.name}`);
    });

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

runMigrations()
  .then(code => process.exit(code));
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
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

async function listMigrations() {
  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  const statuses = await runner.list();

  console.log('Migration Status:');
  console.log('─'.repeat(60));

  statuses.forEach(status => {
    const icon = status.status === 'applied' ? '✓' : '○';
    const date = status.appliedAt
      ? status.appliedAt.toISOString()
      : 'Not applied';

    console.log(`${icon} ${status.name}`);
    console.log(`  Status: ${status.status}`);
    console.log(`  Applied: ${date}`);
    console.log();
  });

  await admin.app().delete();
}

listMigrations();
```

## Rollback Example

Roll back the last migration:

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

async function rollback() {
  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations'
  });

  try {
    console.log('Rolling back last migration...');

    const result = await runner.down();

    console.log(`✓ Rolled back ${result.appliedMigrations.length} migrations`);

    return 0;
  } catch (error) {
    console.error('Rollback failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

rollback()
  .then(code => process.exit(code));
```

## Validation Example

Validate migrations before running:

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

async function validateMigrations() {
  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations',
    config: {
      validateChecksums: true
    }
  });

  const validation = await runner.validate();

  if (validation.valid) {
    console.log('✓ All migrations are valid');
  } else {
    console.error('✗ Validation failed:');
    validation.errors.forEach(error => {
      console.error(`  - ${error.type}: ${error.message}`);
    });
  }

  validation.warnings.forEach(warning => {
    console.warn(`  ⚠ ${warning.type}: ${warning.message}`);
  });

  await admin.app().delete();

  return validation.valid ? 0 : 1;
}

validateMigrations()
  .then(code => process.exit(code));
```

## Backup and Restore

Create and restore backups:

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

async function backupAndRestore() {
  const runner = new FirebaseRunner({
    db: admin.database(),
    migrationsPath: './migrations',
    config: {
      backupPath: './backups'
    }
  });

  try {
    // Create backup
    console.log('Creating backup...');
    const backup = await runner.backup();
    console.log('✓ Backup created:', backup.backupId);
    console.log('  Location:', backup.path);
    console.log('  Size:', (backup.size / 1024).toFixed(2), 'KB');

    // Run migrations
    console.log('\nRunning migrations...');
    await runner.migrate();

    // Optional: Restore from backup
    // await runner.restore(backup.backupId);

    return 0;
  } catch (error) {
    console.error('Operation failed:', error);
    return 1;
  } finally {
    await admin.app().delete();
  }
}

backupAndRestore()
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
    "migrate:validate": "ts-node -r dotenv/config src/validate.ts",
    "migrate:backup": "ts-node -r dotenv/config src/backup.ts"
  }
}
```

## See Also

- [CLI Usage](with-cli) - Using the CLI interface
- [Firebase Emulator](firebase-emulator) - Testing with emulator
- [Getting Started](../getting-started) - Quick start guide
