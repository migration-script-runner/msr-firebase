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
import type { Database } from 'firebase-admin/database';

export const up: IMigrationScript<Database>['up'] = async (db) => {
  await db.ref('users').set({ ... });
};

export const down: IMigrationScript<Database>['down'] = async (db) => {
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

---

## ILockingProvider

Service interface for migration locking (from MSR Core).

```typescript
interface ILockingProvider<DB> {
  acquireLock(runnerId: string): Promise<boolean>;
  verifyLockOwnership(runnerId: string): Promise<boolean>;
  releaseLock(runnerId: string): Promise<void>;
  getLockStatus(): Promise<ILockStatus | null>;
  forceReleaseLock(): Promise<void>;
  checkAndReleaseExpiredLock(): Promise<void>;
}
```

### Methods

- **acquireLock**: Attempt to acquire migration lock
- **verifyLockOwnership**: Verify lock is still owned by this runner
- **releaseLock**: Release lock owned by this runner
- **getLockStatus**: Get current lock status
- **forceReleaseLock**: Force-release lock (dangerous)
- **checkAndReleaseExpiredLock**: Clean up expired locks

### Usage in Firebase

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

if (handler.lockingProvider) {
  const runnerId = 'server-1-12345-uuid';

  // Acquire lock
  const acquired = await handler.lockingProvider.acquireLock(runnerId);
  if (acquired) {
    // Verify ownership
    const verified = await handler.lockingProvider.verifyLockOwnership(runnerId);
    if (verified) {
      // Perform a separate operation protected by this lock.
    }

    // Release when done
    await handler.lockingProvider.releaseLock(runnerId);
  }
}
```

Core acquires and releases this provider automatically while running migrations. Do not manually acquire the lock before calling a runner migration method, because that method uses the same provider and would contend for the lock.

**See**: [Migration Locking Guide]({% link writing-migrations/migration-locking.md %}) for detailed usage.

---

## ILockStatus

Lock status interface (from MSR Core).

```typescript
interface ILockStatus {
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: Date | null;
  expiresAt: Date | null;
  processId?: string;
}
```

### Properties

- **isLocked**: Whether a lock is currently held
- **lockedBy**: Runner ID holding the lock (null if unlocked)
- **lockedAt**: Timestamp when lock was acquired (null if unlocked)
- **expiresAt**: Timestamp when lock expires (null if unlocked)
- **processId** _(optional)_: Process ID parsed from the runner ID

### Example

```typescript
const status = await handler.lockingProvider?.getLockStatus();

if (status && status.isLocked) {
  console.log('Lock held by:', status.lockedBy);
  console.log('Acquired at:', status.lockedAt);
  console.log('Expires at:', status.expiresAt);

  // Check if lock is expired
  const now = new Date();
  const isExpired = status.expiresAt && status.expiresAt < now;
  console.log('Lock expired:', isExpired);
} else {
  console.log('No lock currently held');
}
```
