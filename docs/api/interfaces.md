---
layout: default
title: Interfaces
parent: API Reference
nav_order: 4
---

# Interfaces
{: .no_toc }

Core interfaces for MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## FirebaseDataService

Interface for Firebase data operations.

```typescript
interface FirebaseDataService {
  get<T>(path: string): Promise<T | null>;
  set<T>(path: string, data: T): Promise<void>;
  update(path: string, data: object): Promise<void>;
  remove(path: string): Promise<void>;
  transaction<T>(
    path: string,
    updateFn: (current: T) => T
  ): Promise<{ committed: boolean; snapshot: DataSnapshot }>;
}
```

### Methods

- **get**: Retrieve data from Firebase path
- **set**: Set data at Firebase path
- **update**: Update data at Firebase path
- **remove**: Remove data at Firebase path
- **transaction**: Execute Firebase transaction

---

## EntityService

Interface for entity management.

```typescript
interface EntityService {
  getAll<T>(): Promise<T[]>;
  getById<T>(id: string): Promise<T | null>;
  create<T>(entity: T): Promise<void>;
  update<T>(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Methods

- **getAll**: Retrieve all entities
- **getById**: Retrieve entity by ID
- **create**: Create new entity
- **update**: Update existing entity
- **delete**: Delete entity

---

## IMigrationScript

Migration script interface (from MSR Core).

```typescript
interface IMigrationScript<IDB> {
  up: (db: IDB) => Promise<void>;
  down?: (db: IDB) => Promise<void>;
}
```

### Properties

- **up**: Function to apply migration
- **down** _(optional)_: Function to roll back migration

### Usage in Firebase

```typescript
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({ ... });
};

export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  await db.ref('users').remove();
};
```

---

## ISchemaVersion

Schema version interface (from MSR Core).

```typescript
interface ISchemaVersion {
  timestamp: number;
  name: string;
  appliedAt: Date;
  checksum?: string;
}
```

### Properties

- **timestamp**: Migration timestamp (numeric)
- **name**: Migration name
- **appliedAt**: Date when migration was applied
- **checksum** _(optional)_: File checksum for validation

---

## MigrationConfig

Configuration options (from MSR Core).

```typescript
interface MigrationConfig {
  rollbackStrategy: 'none' | 'down' | 'backup' | 'both';
  validateChecksums: boolean;
  transactionEnabled: boolean;
  backupPath?: string;
  dryRun?: boolean;
}
```

### Properties

- **rollbackStrategy**: How to handle rollbacks
- **validateChecksums**: Enable checksum validation
- **transactionEnabled**: Enable transaction support
- **backupPath** _(optional)_: Path for backup files
- **dryRun** _(optional)_: Run without applying changes

---

## MigrationResult

Result of migration operation (from MSR Core).

```typescript
interface MigrationResult {
  appliedMigrations: ISchemaVersion[];
  failedMigrations: ISchemaVersion[];
  status: 'success' | 'partial' | 'failed';
  error?: Error;
}
```

### Properties

- **appliedMigrations**: Successfully applied migrations
- **failedMigrations**: Migrations that failed
- **status**: Overall operation status
- **error** _(optional)_: Error if operation failed

## See Also

- [Services](services) - Service implementations
- [Types](types) - Type definitions
- [MSR Core Interfaces](https://migration-script-runner.github.io/msr-core/api/interfaces/)
