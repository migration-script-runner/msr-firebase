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
npm install @migration-script-runner/firebase
```

---

## Minimal Example

The simplest possible setup:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function main() {
  // Configure
  const config = new FirebaseConfig();
  config.databaseUrl = 'https://DATABASE-NAME.REGION.firebasedatabase.app';
  config.applicationCredentials = './serviceAccountKey.json';
  config.folder = './migrations';

  // Create runner and execute migrations
  const runner = await FirebaseRunner.getInstance({ config });
  const result = await runner.migrate();
  if (!result.success) {
    throw result.errors?.[0] ?? new Error('Migration failed');
  }

  console.log('Migrations completed successfully!');
}

main().catch(console.error);
```

---

## Complete Example

Full example with error handling. Set `DATABASE_URL` and `GOOGLE_APPLICATION_CREDENTIALS` in the application's process environment; this example does not load `.env` files.

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

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
    if (!result.success) {
      console.error('Migration failed:', result.errors);
      process.exitCode = 1;
      return;
    }

    console.log(`✓ Applied ${result.executed.length} migrations`);
    result.executed.forEach(m => {
      console.log(`  - ${m.name}`);
    });

    process.exitCode = 0;
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  }
}

runMigrations();
```

---

## Environment Variables

Create a `.env` file:

```bash
DATABASE_URL=https://DATABASE-NAME.REGION.firebasedatabase.app
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
NODE_ENV=development
```

Load the file with Node.js or a dotenv package; MSR Firebase does not load `.env` files itself:

```bash
node --env-file=.env app.js
```

---

## Your First Migration

Create a class migration in `./migrations/`. Firebase migrations implement Core's `IRunnableScript<IFirebaseDB>` contract:

```typescript
// migrations/V202501200001_create_users.ts
import { IMigrationInfo, IRunnableScript } from '@migration-script-runner/core';
import { FirebaseHandler, IFirebaseDB } from '@migration-script-runner/firebase';
import { ServerValue } from 'firebase-admin/database';

export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('users')).set({
      user1: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: ServerValue.TIMESTAMP
      }
    });
    return 'Created users';
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('users')).remove();
    return 'Removed users';
  }
}
```

See [Writing Migration Scripts](../writing-migrations/migration-scripts) for naming rules and patterns.
---

## Display Migration Status

Display migration status using the configured renderer:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function listMigrations() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });
  await runner.list();
}

listMigrations();
```

---

## Rollback Migrations

`down(targetVersion)` rolls back migrations newer than a numeric target version:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({ config });
const result = await runner.down(202501150001);
if (!result.success) {
  console.error('Rollback failed:', result.errors);
} else {
  console.log(`Rolled back ${result.executed.length} migrations`);
}
```

Choose the target version that should remain applied. To remove all migrations, use a target before the first migration (commonly `0`).

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
    onBeforeMigrate: async (script) => {
      console.log(`Starting migration: ${script.name}`);
    },
    onAfterMigrate: async (script, result) => {
      console.log(`Completed ${script.name}: ${result}`);
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
    const result = await runner.migrate();
    if (!result.success) {
      console.error('✗ Migrations failed:', result.errors);
      process.exitCode = 1;
      return;
    }
    console.log('✓ Migrations complete');
  } catch (error) {
    console.error('✗ Migrations failed:', error);
    process.exitCode = 1;
    return;
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
> For inherited methods from MSR Core (like `migrate()`, `down()`, `list()`), see [MSR Core API Documentation](https://core.migration-script-runner.dev/api/).
