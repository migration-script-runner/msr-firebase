---
layout: default
title: Backup & Restore
parent: Writing Migrations
nav_order: 3
---

# Backup & Restore
{: .no_toc }

Learn about backup strategies and restore operations for Firebase migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

MSR Firebase provides built-in backup and restore functionality to protect your data during migrations.

## Creating Backups

### Using the API

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Create backup
const backupPath = await runner.createBackup();
console.log('Backup created:', backupPath);
```

### Using the CLI

```bash
msr-firebase backup create
```

**Output:**
```
Creating backup...
✓ Backup created successfully: ./backups/backup-2025-01-22-01-30-45.bkp
```

## Backup Format

Firebase backup files contain the serialized database data returned by the adapter's backup implementation. Core writes that content to the configured backup file; the file path is returned by `createBackup()`.

```json
{
  "users": {
    "user1": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

## Automatic Backups

Configure automatic backups before migrations:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Backup will be created automatically
await runner.migrate();
```

## Restoring from Backup

### Using the API

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Restore from backup
await runner.restoreFromBackup('./backups/backup-2025-01-22-01-30-45.bkp');
```

{: .warning }
> Restore will overwrite all existing data. Use with extreme caution!

### Using the CLI

```bash
msr-firebase backup restore ./backups/backup-2025-01-22-01-30-45.bkp
```

The command restores the file immediately; it does not prompt for confirmation. Restore overwrites the database data represented by the backup, so verify the target and backup path before running it.

## Rollback with Backups

MSR automatically creates and restores backups during migrations:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Backup is created automatically before migrating
await runner.migrate();

// If migration fails, backup is restored automatically

// Manual rollback also uses backup
await runner.down();
```

## Backup Strategies

### Strategy 1: Before Every Migration Run

```typescript
import { RollbackStrategy } from '@migration-script-runner/core';

appConfig.rollbackStrategy = RollbackStrategy.BACKUP;
appConfig.backup.folder = './backups';
```

**Pros:** Maximum safety
**Cons:** Slower, requires storage

### Strategy 2: Manual Backups

```typescript
// Create backup manually before important migrations
await runner.createBackup();

// Run migrations
await runner.migrate();
```

**Pros:** Full control
**Cons:** Requires discipline

### Strategy 3: Scheduled Backups

```typescript
import { schedule } from 'node-cron';

// Backup every day at 2 AM
schedule('0 2 * * *', async () => {
  await runner.createBackup();
});
```

**Pros:** Regular backups independent of migrations
**Cons:** May not align with migration timing

### Strategy 4: Hybrid Approach

```typescript
import { RollbackStrategy } from '@migration-script-runner/core';

appConfig.rollbackStrategy = RollbackStrategy.BOTH; // Use down() if available, backup as fallback
```

**Pros:** Fast rollback with safety net
**Cons:** More complex

## Backup Management

### List Backups

```typescript
import { readdirSync } from 'fs';
import { join } from 'path';

const backupDir = './backups';
const backups = readdirSync(backupDir)
  .filter(f => f.startsWith('backup-') && f.endsWith('.bkp'))
  .map(f => {
    const stat = statSync(join(backupDir, f));
    return {
      file: f,
      size: stat.size,
      created: stat.birthtime
    };
  })
  .sort((a, b) => b.created.getTime() - a.created.getTime());

console.log('Available backups:', backups);
```

### Delete Old Backups

```typescript
import { unlinkSync, statSync } from 'fs';
import { join } from 'path';

function deleteOldBackups(backupDir: string, keepLast: number = 10) {
  const backups = readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.bkp'))
    .map(f => ({
      file: f,
      path: join(backupDir, f),
      created: statSync(join(backupDir, f)).birthtime
    }))
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  // Keep only last N backups
  backups.slice(keepLast).forEach(backup => {
    unlinkSync(backup.path);
    console.log('Deleted old backup:', backup.file);
  });
}

deleteOldBackups('./backups', 10);
```

## Storage Considerations

### Local Storage

```typescript
appConfig.backup.folder = './backups'; // Local directory
```

**Pros:** Fast, simple
**Cons:** Limited space, not persistent across deployments

### Cloud Storage

Upload backups to cloud storage:

```typescript
import { Storage } from '@google-cloud/storage';

async function uploadBackup(localPath: string, backupId: string) {
  const storage = new Storage();
  const bucket = storage.bucket('my-backups');

  await bucket.upload(localPath, {
    destination: `firebase-backups/${backupId}`,
    metadata: {
      contentType: 'application/json'
    }
  });

  console.log('Backup uploaded to cloud storage');
}

// After creating backup
const backupPath = await runner.createBackup();
await uploadBackup(backupPath, backupPath.split('/').pop() ?? 'firebase-backup.bkp');
```

## Backup Size Optimization

### Exclude Unnecessary Data

```typescript
import type { Database } from 'firebase-admin/database';
import type { IMigrationScript } from '@migration-script-runner/core';

export const up: IMigrationScript<Database>['up'] = async (db) => {
  // Temporarily remove large data before backup
  const largeData = await db.ref('analytics').once('value');
  await db.ref('analytics').remove();

  // Migration logic...

  // Restore large data
  await db.ref('analytics').set(largeData.val());
};
```

### Compress Backups

```typescript
import { createGzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function compressBackup(backupPath: string) {
  const gzip = createGzip();
  const source = createReadStream(backupPath);
  const destination = createWriteStream(`${backupPath}.gz`);

  await pipeline(source, gzip, destination);
  console.log('Backup compressed');
}
```

## Testing Backups

Always verify backups are valid:

```typescript
import { readFileSync } from 'fs';

function validateBackup(backupPath: string): boolean {
  try {
    const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

    // Verify structure
    if (!backup.metadata || !backup.data) {
      throw new Error('Invalid backup structure');
    }

    // Verify metadata
    if (!backup.metadata.timestamp || !backup.metadata.databaseURL) {
      throw new Error('Invalid backup metadata');
    }

    return true;
  } catch (error) {
    console.error('Backup validation failed:', error);
    return false;
  }
}
```

## Disaster Recovery

### Complete Backup/Restore Flow

```typescript
// 1. Create backup before risky operation
const backupPath = await runner.createBackup();
console.log('Backup created:', backupPath);

try {
  // 2. Perform risky migration
  await runner.migrate();

  // 3. Validate results
  const snapshot = await db.ref('users').once('value');
  if (!snapshot.exists()) {
    throw new Error('Migration produced invalid state');
  }

  console.log('Migration successful');
} catch (error) {
  console.error('Migration failed, restoring backup...');

  // 4. Restore on failure
  await runner.restoreFromBackup(backupPath);

  console.log('Database restored from backup');
  throw error;
}
```
