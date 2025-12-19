---
layout: default
title: FirebaseHandler
parent: API Reference
nav_order: 1
---

# FirebaseHandler
{: .no_toc }

Database handler implementation for Firebase Realtime Database.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`FirebaseHandler` implements the `IDatabaseMigrationHandler` interface from MSR Core, providing Firebase-specific implementations for migration tracking, backup, restore, and optional migration locking operations.

## Class Signature

```typescript
class FirebaseHandler implements IDatabaseMigrationHandler<IFirebaseDB>
```

## Properties

### db

Firebase database instance for executing migrations.

```typescript
db: IFirebaseDB
```

### backup

Service for backup and restore operations.

```typescript
backup: IBackupService
```

### schemaVersion

Service for tracking migration schema versions.

```typescript
schemaVersion: ISchemaVersion<IFirebaseDB>
```

### lockingService

Optional locking service for preventing concurrent migrations in distributed environments.

```typescript
lockingService?: ILockingService<IFirebaseDB>
```

**Availability**: Only present when locking is enabled in configuration.

**Example:**
```typescript
const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

if (handler.lockingService) {
  const status = await handler.lockingService.getLockStatus();
  console.log('Lock status:', status);
}
```

### cfg

Configuration used to initialize the handler.

```typescript
cfg: AppConfig
```

## Factory Method

### getInstance()

Creates a new FirebaseHandler instance (preferred method).

```typescript
static async getInstance(cfg: AppConfig): Promise<FirebaseHandler>
```

**Parameters**:
- **cfg**: Application configuration including database URL, locking settings, and migration paths

**Returns**: Promise resolving to configured FirebaseHandler

**Example:**
```typescript
import { FirebaseHandler, AppConfig } from '@migration-script-runner/firebase';

const appConfig = new AppConfig();
appConfig.databaseUrl = 'https://your-project.firebaseio.com';
config.locking = {
  enabled: true,
  timeout: 600000
};

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();
```

## Methods

### getName()

Returns the handler name.

```typescript
getName(): string
```

**Returns**: `"Firebase Realtime Database Handler"`

### getVersion()

Returns the package version.

```typescript
getVersion(): string
```

**Returns**: Version string (e.g., `"0.1.6"`)

## Usage Examples

### Basic Usage

```typescript
import { FirebaseHandler, AppConfig } from '@migration-script-runner/firebase';

// Create configuration
const appConfig = new AppConfig();
appConfig.databaseUrl = 'https://your-project.firebaseio.com';
config.tableName = 'schema_version';
appConfig.shift = 'production';

// Create handler
const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

// Access services
console.log('Handler:', handler.getName());
console.log('Version:', handler.getVersion());

// Use backup service
await handler.backup.backup();

// Check schema version
const records = await handler.schemaVersion.migrationRecords();
console.log('Applied migrations:', records);
```

### With Migration Locking

```typescript
import { FirebaseHandler, AppConfig } from '@migration-script-runner/firebase';

const appConfig = new AppConfig();
appConfig.databaseUrl = 'https://your-project.firebaseio.com';

// Enable locking for production
config.locking = {
  enabled: true,
  timeout: 600000  // 10 minutes
};

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

// Check if locking is enabled
if (handler.lockingService) {
  // Acquire lock
  const executorId = `${hostname()}-${process.pid}-${uuidv4()}`;
  const acquired = await handler.lockingService.acquireLock(executorId);

  if (acquired) {
    console.log('Lock acquired, safe to run migrations');

    // Verify we still own the lock
    const verified = await handler.lockingService.verifyLockOwnership(executorId);
    if (verified) {
      // Run migrations...
    }

    // Release lock when done
    await handler.lockingService.releaseLock(executorId);
  } else {
    console.log('Lock already held by another process');
  }
} else {
  console.log('Locking not enabled');
}
```

### Environment-Specific Configuration

```typescript
import { FirebaseHandler, AppConfig } from '@migration-script-runner/firebase';

const isProduction = process.env.NODE_ENV === 'production';

const appConfig = new AppConfig();
appConfig.databaseUrl = process.env.DATABASE_URL;
config.locking = {
  enabled: isProduction,  // Only in production
  timeout: 600000
};

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();
```

## See Also

- [FirebaseRunner](FirebaseRunner) - Main migration runner class
- [Migration Locking](../guides/migration-locking) - Distributed locking guide
- [Configuration](../guides/configuration) - Configuration options
- [Interfaces](interfaces) - Core interfaces including ILockingService
