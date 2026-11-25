---
layout: default
title: Backup & Restore
parent: Writing Migrations
nav_order: 3
---

# Backup & Restore
{: .no_toc }

Create and restore database backups with MSR Core's backup workflow and the Firebase adapter.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Create a Backup

### From TypeScript

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.folder = './migrations';
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config });
const backupPath = await runner.createBackup();
console.log(`Backup created at ${backupPath}`);
```

### From the CLI

```bash
npx msr-firebase backup create
```

The command prints the created file path. Core stores backups in the configured backup folder.

## Backup Contents

The Firebase adapter serializes a path-to-data object. By default, the root database is represented under `/`:

```json
{
  "/": {
    "users": {
      "user1": { "name": "Ada" }
    }
  }
}
```

The backup file contains database data, not a metadata envelope. Treat backup files as sensitive because they may contain the full database.

## Automatic Backup and Rollback

Core's `backupMode` controls automatic backup behavior. With the defaults `backupMode: 'full'` and `rollbackStrategy: 'backup'`, Core creates a backup before migration, restores it on failure, and deletes it on success. Other modes are `create_only`, `restore_only`, and `manual`; see [Backup configuration](../library-usage/configuration#backupmode).

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.folder = './migrations';
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.backupMode = 'full';

const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

If you change either option, see [Library Configuration](../library-usage/configuration#backupmode) for how they work together.

## Selective Backups

Set `backupPaths` to include selected Firebase paths in Core-managed backups. Paths are relative to `shift`; omit the setting to preserve full-database backups.

```typescript
const config = new FirebaseConfig();
config.shift = 'production';
config.backupPaths = ['users', 'settings/theme'];
```

The equivalent CLI option is:

```bash
npx msr-firebase migrate --backup-paths users settings/theme
```

Restoring a selective backup writes the paths present in the backup. A selected path that was absent when the backup was created is removed if it was added later. Data outside the selected paths is left unchanged. Empty, invalid, duplicate, or overlapping path selections are rejected.

## Restore a Backup

### From TypeScript

```typescript
const runner = await FirebaseRunner.getInstance({ config });
await runner.restoreFromBackup('./backups/backup-file.bkp');
```

Omit `backupPath` only when restoring a backup created earlier by the same runner instance. For a separate CLI invocation, pass the file path explicitly.

### From the CLI

```bash
npx msr-firebase backup restore ./backups/backup-file.bkp
```

The CLI runs in a new process, so pass the path printed by `backup create`:

```bash
npx msr-firebase backup restore "<backupPath>"
```

{: .warning }
> Restore writes database data immediately. A full backup can replace the full database; a selective backup changes only its listed paths. Confirm the Firebase project, `shift`, backup file, and backup mode before restoring.

## Recovery Around a Migration

For an application-managed recovery flow, set `backupMode` to `manual` so Core does not create an automatic backup as well. Retain the path returned by `createBackup()` and use that exact path if migration fails:

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.folder = './migrations';
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.backupMode = 'manual';

const runner = await FirebaseRunner.getInstance({ config });
const backupPath = await runner.createBackup();

try {
  await runner.migrate();
} catch (error) {
  await runner.restoreFromBackup(backupPath);
  throw error;
}
```

The backup file must still be available to the process. For manual storage, retention, cloud uploads, and compression, see [Backup Storage and Retention](backup-storage).
