---
layout: default
title: Backup & Restore
parent: Guides
nav_order: 5
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
import { FirebaseRunner } from '@migration-script-runner/firebase';

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  config: {
    backupPath: './backups'
  }
});

// Create backup
const result = await runner.backup();
console.log('Backup created:', result.backupId);
console.log('Location:', result.path);
```

### Using the CLI

```bash
msr-firebase backup
```

**Output:**
```
Creating backup...
✓ Backup created: backup-1234567890.json
Location: ./backups/backup-1234567890.json
Size: 2.5 MB
```

## Backup Format

Backups are stored as JSON files:

```json
{
  "metadata": {
    "timestamp": 1234567890,
    "databaseURL": "https://your-project.firebaseio.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "version": "0.1.0"
  },
  "data": {
    "users": {
      "user1": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

## Automatic Backups

Configure automatic backups before migrations:

```typescript
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  config: {
    rollbackStrategy: 'backup', // Auto-backup before migrations
    backupPath: './backups'
  }
});

// Backup will be created automatically
await runner.migrate();
```

## Restoring from Backup

### Using the API

```typescript
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations'
});

// Restore from backup
await runner.restore('backup-1234567890.json');
```

{: .warning }
> Restore will overwrite all existing data. Use with extreme caution!

### Using the CLI

```bash
msr-firebase restore backup-1234567890.json
```

**Confirmation prompt:**
```
⚠️  Warning: This will overwrite all data in the database!
Database: https://your-project.firebaseio.com
Backup: backup-1234567890.json (created 2024-01-15 10:30:00)

Are you sure you want to continue? (y/N): y

Restoring backup...
✓ Backup restored successfully
```

## Rollback with Backups

When using `rollbackStrategy: 'backup'`, MSR automatically creates and restores backups:

```typescript
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  config: {
    rollbackStrategy: 'backup'
  }
});

// Backup is created automatically before migrating
await runner.migrate();

// If migration fails, backup is restored automatically

// Manual rollback also uses backup
await runner.down();
```

## Backup Strategies

### Strategy 1: Before Every Migration Run

```typescript
config: {
  rollbackStrategy: 'backup',
  backupPath: './backups'
}
```

**Pros:** Maximum safety
**Cons:** Slower, requires storage

### Strategy 2: Manual Backups

```typescript
// Create backup manually before important migrations
await runner.backup();

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
  await runner.backup();
});
```

**Pros:** Regular backups independent of migrations
**Cons:** May not align with migration timing

### Strategy 4: Hybrid Approach

```typescript
config: {
  rollbackStrategy: 'both' // Use down() if available, backup as fallback
}
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
  .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
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
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
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
config: {
  backupPath: './backups' // Local directory
}
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
const result = await runner.backup();
await uploadBackup(result.path, result.backupId);
```

## Backup Size Optimization

### Exclude Unnecessary Data

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
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
const backup = await runner.backup();
console.log('Backup created:', backup.backupId);

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
  await runner.restore(backup.backupId);

  console.log('Database restored from backup');
  throw error;
}
```

## See Also

- [Configuration](configuration) - Backup configuration options
- [CLI Usage](cli-usage) - CLI backup commands
- [Writing Migrations](writing-migrations) - Migration best practices
