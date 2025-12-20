---
layout: default
title: Quick Start
parent: Library Usage
nav_order: 1
---

# Quick Start
{: .no_toc }

Get started with MSR Firebase programmatically in minutes.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Installation

```bash
npm install @migration-script-runner/firebase firebase-admin
```

---

## Minimal Example

The simplest possible setup:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function main() {
  // Configure
  const config = new FirebaseConfig();
  config.databaseUrl = 'https://your-project.firebaseio.com';
  config.applicationCredentials = './serviceAccountKey.json';
  config.folder = './migrations';

  // Create runner and execute migrations
  const runner = await FirebaseRunner.getInstance({ config });
  await runner.migrate();

  console.log('Migrations completed successfully!');
}

main().catch(console.error);
```

---

## Complete Example

Full example with error handling:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import 'dotenv/config';

async function runMigrations() {
  // Configure
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.tableName = 'schema_version';

  try {
    console.log('Initializing Firebase runner...');
    const runner = await FirebaseRunner.getInstance({ config });

    console.log('Running migrations...');
    const result = await runner.migrate();

    console.log(`✓ Applied ${result.executed.length} migrations`);
    result.executed.forEach(m => {
      console.log(`  - ${m.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
```

---

## Environment Variables

Create a `.env` file:

```bash
DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
NODE_ENV=development
```

Load environment variables:

```typescript
import 'dotenv/config';
```

---

## Your First Migration

Create a migration file in `./migrations/`:

```typescript
// migrations/202501200001-create-users.ts
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({
    user1: {
      name: 'John Doe',
      email: 'john@example.com',
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

---

## List Migrations

Check migration status programmatically:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function listMigrations() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });
  const migrations = await runner.list();

  console.log('Migration Status:');
  console.log('─'.repeat(60));

  migrations.forEach(m => {
    const icon = m.status === 'executed' ? '✓' : '○';
    const date = m.executedAt
      ? new Date(m.executedAt).toISOString()
      : 'Not applied';

    console.log(`${icon} ${m.name}`);
    console.log(`  Status: ${m.status}`);
    console.log(`  Applied: ${date}`);
    console.log();
  });
}

listMigrations();
```

---

## Rollback Migrations

Roll back the last migration:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function rollback() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });

  try {
    console.log('Rolling back last migration...');
    const result = await runner.down();

    console.log(`✓ Rolled back ${result.executed.length} migrations`);
    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

rollback();
```

---

## With Custom Logger

Use a custom logger implementation:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { ConsoleLogger } from '@migration-script-runner/core';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  logger: new ConsoleLogger({ level: 'debug' })
});

await runner.migrate();
```

---

## With Lifecycle Hooks

Add custom hooks for migration events:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  hooks: {
    beforeMigrate: async (info) => {
      console.log(`Starting migration: ${info.name}`);
    },
    afterMigrate: async (info, result) => {
      console.log(`Completed: ${result}`);
    },
    onError: async (error) => {
      console.error('Migration error:', error);
    }
  }
});

await runner.migrate();
```

---

## Application Integration

Integrate migrations into your app startup:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import express from 'express';

async function startServer() {
  // Run migrations before starting server
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  try {
    console.log('Running migrations...');
    const runner = await FirebaseRunner.getInstance({ config });
    await runner.migrate();
    console.log('✓ Migrations complete');
  } catch (error) {
    console.error('✗ Migrations failed:', error);
    process.exit(1);
  }

  // Start server
  const app = express();
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
}

startServer();
```

---

## Next Steps

- **[Configuration](configuration)** - Learn about all configuration options
- **[API Reference](../api/)** - Explore Firebase-specific methods
- **[Examples](examples)** - See advanced usage patterns
- **[Writing Migrations](../writing-migrations/)** - Learn how to write migration scripts

{: .note }
> For inherited methods from MSR Core (like `migrate()`, `down()`, `list()`), see [MSR Core API Documentation](https://migration-script-runner.github.io/msr-core/api/).
