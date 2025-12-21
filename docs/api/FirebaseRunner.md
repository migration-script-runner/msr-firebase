---
layout: default
title: FirebaseRunner
parent: API Reference
nav_order: 1
---

# FirebaseRunner
{: .no_toc }

Main migration runner class for Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`FirebaseRunner` is the primary class for executing migrations in Firebase Realtime Database. It extends MSR Core's `MigrationScriptExecutor` and provides Firebase-specific functionality.

**Inheritance:** Extends [`MigrationScriptExecutor`](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor) from MSR Core

{: .note }
> For inherited methods like `migrate()`, `down()`, `list()`, `validate()`, see the [MSR Core MigrationScriptExecutor API](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor)

## Class Signature

```typescript
class FirebaseRunner extends MigrationScriptExecutor<IFirebaseDB, FirebaseHandler, FirebaseConfig>
```

---

## Factory Method

### getInstance()

Creates a new FirebaseRunner instance (recommended method).

```typescript
static async getInstance(
  options: IExecutorOptions<IFirebaseDB, FirebaseConfig>
): Promise<FirebaseRunner>
```

#### Parameters

**options.config** - `FirebaseConfig` (required)
Configuration for Firebase connection and migrations. See [FirebaseConfig](FirebaseConfig) for details.

**options.logger** - `ILogger` (optional)
Custom logger implementation. Defaults to console logger.

**options.hooks** - `IHooks` (optional)
Lifecycle hooks for migration events (beforeMigrate, afterMigrate, etc).

**options.metricsCollectors** - `IMetricsCollector[]` (optional)
Array of metrics collectors for tracking migration performance.

#### Returns

`Promise<FirebaseRunner>` - Initialized runner instance ready to execute migrations

#### Example: Basic Usage

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';
config.tableName = 'schema_version';

const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

#### Example: With Optional Services

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { ConsoleLogger } from '@migration-script-runner/core';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  logger: new ConsoleLogger({ level: 'debug' }),
  hooks: {
    beforeMigrate: async (info) => {
      console.log(`Starting migration: ${info.name}`);
    },
    afterMigrate: async (info, result) => {
      console.log(`Completed: ${result}`);
    }
  }
});

await runner.migrate();
```

---

## Firebase-Specific Methods

These methods are unique to FirebaseRunner and provide Firebase-specific functionality:

### getConnectionInfo()

Returns Firebase connection details.

```typescript
getConnectionInfo(): {
  databaseUrl?: string;
  shift?: string;
  tableName: string;
}
```

#### Returns

- **databaseUrl** - Firebase Realtime Database URL
- **shift** - Root path prefix (for multi-environment databases)
- **tableName** - Migration tracking table name

#### Example

```typescript
const info = runner.getConnectionInfo();
console.log('Connected to:', info.databaseUrl);
console.log('Shift path:', info.shift);
console.log('Table name:', info.tableName);
```

---

### getDatabase()

Returns the Firebase database reference for direct access.

```typescript
getDatabase(): admin.database.Database
```

#### Returns

`admin.database.Database` - Firebase Admin SDK database instance

#### Example

```typescript
const db = runner.getDatabase();

// Direct Firebase operations
const usersRef = db.ref('users');
const snapshot = await usersRef.once('value');
console.log('Users:', snapshot.val());
```

{: .warning }
> Use this method carefully. Direct database operations bypass migration tracking.

---

### listNodes()

Lists all root nodes in the Firebase database.

```typescript
async listNodes(): Promise<string[]>
```

#### Returns

`Promise<string[]>` - Array of root node names

#### Example

```typescript
const nodes = await runner.listNodes();
console.log('Root nodes:', nodes);
// Output: ['users', 'posts', 'schema_version']
```

---

### backupNodes()

Backs up specific nodes from the Firebase database.

```typescript
async backupNodes(nodes: string[]): Promise<Record<string, unknown>>
```

#### Parameters

**nodes** - `string[]`
Array of node paths to backup (relative to shift path)

#### Returns

`Promise<Record<string, unknown>>` - Object mapping node paths to their data

#### Example

```typescript
// Backup specific nodes before risky operations
const backup = await runner.backupNodes(['users', 'posts']);
console.log('Backed up users:', backup.users);

// Later, restore if needed
const db = runner.getDatabase();
await db.ref('users').set(backup.users);
```

---

## Inherited Methods

FirebaseRunner inherits all standard migration methods from MSR Core's `MigrationScriptExecutor`:

### Migration Operations

- **`migrate(targetVersion?)`** - Run pending migrations
- **`down(targetVersion)`** - Rollback migrations
- **`list()`** - List all migrations with status
- **`validate()`** - Validate migration scripts

### Data Operations

- **`backup()`** - Create database backup
- **`restore(backupId)`** - Restore from backup

{: .note }
> **Full documentation:** See [MSR Core MigrationScriptExecutor API](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor) for detailed documentation of inherited methods.

---

## Usage Examples

### Complete Migration Workflow

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function runMigrations() {
  // 1. Setup configuration
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.shift = process.env.NODE_ENV; // dev/staging/production

  // 2. Create runner
  const runner = await FirebaseRunner.getInstance({ config });

  // 3. List current state
  const migrations = await runner.list();
  console.log(`Found ${migrations.length} migrations`);

  // 4. Validate before running
  const validation = await runner.validate();
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    return;
  }

  // 5. Create backup (optional but recommended)
  await runner.backup();

  // 6. Run migrations
  const result = await runner.migrate();
  console.log(`Applied ${result.executed.length} migrations`);
}

runMigrations().catch(console.error);
```

### With Error Handling

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function safeMigrate() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });

  try {
    // Create backup before migration
    const backup = await runner.backup();
    console.log('Backup created:', backup.id);

    // Run migrations
    const result = await runner.migrate();

    if (result.success) {
      console.log('✓ Migrations successful');
    } else {
      console.error('✗ Migrations failed:', result.errors);

      // Restore from backup
      await runner.restore(backup.id);
      console.log('Restored from backup');
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

safeMigrate();
```

### Production Setup with Locking

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function productionMigrate() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  // Enable locking for distributed environments
  config.locking = {
    enabled: true,
    timeout: 600000 // 10 minutes
  };

  const runner = await FirebaseRunner.getInstance({ config });

  // Locking is handled automatically
  const result = await runner.migrate();
  console.log('Migration result:', result);
}
```

