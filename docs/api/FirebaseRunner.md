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

`FirebaseRunner` is the primary class for executing migrations in Firebase Realtime Database. It extends MSR Core's `MigrationScriptRunner` and provides Firebase-specific functionality.

**Inheritance:** Extends [`MigrationScriptRunner`](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner) from MSR Core

{: .note }
> For inherited methods like `migrate()`, `down()`, `list()`, `validate()`, see the [MSR Core MigrationScriptRunner API](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner)

## Class Signature

```typescript
class FirebaseRunner extends MigrationScriptRunner<IFirebaseDB, FirebaseHandler, FirebaseConfig>
```

---

## Factory Method

### getInstance()

Creates a new FirebaseRunner instance (recommended method).

```typescript
static override getInstance(
  options: IRunnerOptions<IFirebaseDB, FirebaseConfig>
): Promise<FirebaseRunner>
```

#### Parameters

**options.config** - `FirebaseConfig` (optional)
Configuration for Firebase connection and migrations. If omitted, Core starts with Firebase-specific defaults and resolves its config file and `MSR_*` environment variables before connecting. An explicitly supplied config is used as-is and skips config loading. See [FirebaseConfig](FirebaseConfig) for details.

**options.configLoader** - `IConfigLoader<FirebaseConfig>` (optional)
Custom Core-compatible loader for resolving Firebase configuration before the handler connects. When omitted, Core uses its default loader.

**options.logger** - `ILogger` (optional)
Custom logger implementation. Defaults to console logger.

**options.hooks** - `IHooks` (optional)
Lifecycle hooks for migration events (beforeMigrate, afterMigrate, etc).

**options.metricsCollectors** - `IMetricsCollector[]` (optional)
Array of metrics collectors for tracking migration performance.

#### Returns

`Promise<FirebaseRunner>` - Initialized runner instance ready to execute migrations

#### Adapter Factory Implementation

The adapter overrides the Core factory and delegates config resolution, handler creation, and runner construction to Core's `createInstance()` helper. This resolves configuration once before opening Firebase and passes the same config to both the handler and runner.

```typescript
static override getInstance(
  options: IRunnerOptions<IFirebaseDB, FirebaseConfig>
): Promise<FirebaseRunner> {
  return this.createInstance(
    options,
    () => new FirebaseConfig(),
    (config) => FirebaseHandler.getInstance(config),
    (dependencies) => new FirebaseRunner(dependencies)
  );
}
```

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

#### Example: Load Configuration Before Connecting

When you rely on Core's config file or `MSR_*` variables, omit `config`. `FirebaseConfig` still initializes Firebase fields from `DATABASE_URL` and `GOOGLE_APPLICATION_CREDENTIALS`; Core resolves the remaining configuration before creating the Firebase handler.

```typescript
const runner = await FirebaseRunner.getInstance({});
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
getDatabase(): Database
```

#### Returns

`Database` - Firebase Admin SDK database instance

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
// The returned object maps each requested path to its current value.
const backup = await runner.backupNodes(['users', 'posts']);
console.log('Backed up users:', backup.users);

// For managed backup and restore, use createBackup()/restoreFromBackup().
// See the Backup & Restore guide before restoring production data.
```

---

## Inherited Methods

FirebaseRunner inherits all standard migration methods from MSR Core's `MigrationScriptRunner`:

### Migration Operations

- **`migrate(targetVersion?)`** - Run pending migrations
- **`down(targetVersion)`** - Rollback migrations
- **`list()`** - List all migrations with status
- **`validate()`** - Validate migration scripts

### Data Operations

- **`createBackup()`** - Create a backup file and return its path
- **`restoreFromBackup(backupPath?)`** - Restore from a backup file
- **`deleteBackup()`** - Delete the current backup when configured

{: .note }
> **Full documentation:** See [MSR Core MigrationScriptRunner API](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner) for detailed documentation of inherited methods.

---

## See Also

- [Library Quick Start](../library-usage/quick-start) — initialize a runner and run migrations.
- [Library Examples](../library-usage/examples) — application integration patterns.
- [Backup & Restore](../writing-migrations/backup-restore) — backup methods and recovery.
- [MSR Core MigrationScriptRunner API](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner) — inherited methods and behavior.
