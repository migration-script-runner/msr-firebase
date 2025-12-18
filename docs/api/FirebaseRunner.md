---
layout: default
title: FirebaseRunner
parent: API Reference
nav_order: 2
---

# FirebaseRunner
{: .no_toc }

Main migration runner class for Firebase Realtime Database.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`FirebaseRunner` extends `MigrationScriptExecutor` from MSR Core and provides the main entry point for running Firebase migrations.

## Class Signature

```typescript
class FirebaseRunner extends MigrationScriptExecutor<admin.database.Database>
```

## Constructor

```typescript
constructor(options: {
  db: admin.database.Database;
  migrationsPath: string;
  config?: Partial<MigrationConfig>;
})
```

### Parameters

- **db**: Firebase Realtime Database instance
- **migrationsPath**: Path to migrations directory
- **config** _(optional)_: Migration configuration options

## Methods

### migrate()

Runs all pending migrations.

```typescript
async migrate(): Promise<MigrationResult>
```

**Returns**: Result containing applied migrations and status

### down()

Rolls back migrations.

```typescript
async down(options?: { steps?: number; to?: number }): Promise<MigrationResult>
```

**Parameters**:
- **steps** _(optional)_: Number of migrations to roll back
- **to** _(optional)_: Roll back to specific timestamp

**Returns**: Result containing rolled back migrations

### list()

Lists all migrations with their status.

```typescript
async list(): Promise<MigrationStatus[]>
```

**Returns**: Array of migration statuses (applied/pending)

### validate()

Validates migration files and integrity.

```typescript
async validate(): Promise<ValidationResult>
```

**Returns**: Validation result with any errors or warnings

### backup()

Creates a backup of the database.

```typescript
async backup(): Promise<BackupResult>
```

**Returns**: Backup result with backup identifier

### restore()

Restores database from a backup.

```typescript
async restore(backupId: string): Promise<RestoreResult>
```

**Parameters**:
- **backupId**: Identifier of backup to restore

**Returns**: Restore operation result

## Usage Examples

### Basic Migration

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations'
});

// Run migrations
const result = await runner.migrate();
console.log('Migrations applied:', result.appliedMigrations);
```

### With Configuration

```typescript
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  config: {
    rollbackStrategy: 'backup',
    validateChecksums: true,
    transactionEnabled: true
  }
});

// List all migrations
const status = await runner.list();
status.forEach(m => {
  console.log(`${m.timestamp}: ${m.status}`);
});
```

### Rollback Example

```typescript
// Rollback last 2 migrations
await runner.down({ steps: 2 });

// Rollback to specific migration
await runner.down({ to: 1234567890 });
```

## Configuration Options

See [Configuration Guide](../guides/configuration) for detailed configuration options.

## See Also

- [FirebaseHandler](FirebaseHandler) - Database handler implementation
- [Getting Started](../getting-started) - Quick start guide
- [CLI Usage](../guides/cli-usage) - Using the CLI instead of API
