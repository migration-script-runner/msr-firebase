---
layout: default
title: Backup Storage and Retention
parent: Writing Migrations
nav_order: 4
---

# Backup Storage and Retention
{: .no_toc }

Patterns for managing backup files outside MSR's built-in create and restore workflow.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## What MSR Manages

MSR creates and restores backup files according to Core configuration. In `full` mode it removes the automatic backup after a successful migration; use `create_only` or an explicit `manual` workflow when you need to retain files. MSR does not provide a backup catalog, scheduled retention policy, cloud upload, or compression service. The examples below are application or operations recipes that you own and should adapt to your storage, access, and recovery requirements.

For the built-in backup commands and `backupPaths`, see [Backup & Restore](backup-restore).

## List Local Backup Files

This Node.js example lists matching files in the configured backup directory:

```typescript
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

async function listBackups(directory: string) {
  const entries = await readdir(directory);
  const backups = await Promise.all(
    entries
      .filter((name) => name.startsWith('backup-') && name.endsWith('.bkp'))
      .map(async (name) => {
        const path = join(directory, name);
        const file = await stat(path);
        return { name, path, size: file.size, modifiedAt: file.mtime };
      })
  );

  return backups.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}
```

## Apply a Retention Policy

Deleting old backups is your responsibility. Keep backups in a location that is separate from the application container when they must survive redeployments. Review the list and retention rules before enabling automatic deletion. The example rejects a negative retention count.

```typescript
import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

async function pruneBackups(directory: string, keepLatest: number): Promise<void> {
  if (!Number.isInteger(keepLatest) || keepLatest < 0) {
    throw new RangeError('keepLatest must be a non-negative integer');
  }

  const files = await readdir(directory);
  const backups = await Promise.all(
    files
      .filter((name) => name.startsWith('backup-') && name.endsWith('.bkp'))
      .map(async (name) => {
        const path = join(directory, name);
        return { path, modifiedAt: (await stat(path)).mtime };
      })
  );
  backups.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

  for (const backup of backups.slice(keepLatest)) {
    await unlink(backup.path);
  }
}
```

## Upload to Cloud Storage

Upload only after `createBackup()` succeeds, and retain the local path until the upload is verified. This optional example requires the `@google-cloud/storage` package. Configure bucket access using your platform's identity and least-privilege permissions.

```typescript
import { Storage } from '@google-cloud/storage';
import { basename } from 'node:path';

async function uploadBackup(backupPath: string, bucketName: string): Promise<void> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  await bucket.upload(backupPath, {
    destination: `firebase-backups/${basename(backupPath)}`,
    metadata: { contentType: 'application/json' }
  });
}
```

## Compress Backup Files

Compression is not built into MSR. If you compress a backup, decompress it to a file before passing the path to `restoreFromBackup()` or `backup restore`; MSR expects its normal JSON backup content.

```typescript
import { createGzip, createGunzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

async function gzipBackup(sourcePath: string, compressedPath: string): Promise<void> {
  await pipeline(createReadStream(sourcePath), createGzip(), createWriteStream(compressedPath));
}

async function restoreInputFile(compressedPath: string, jsonPath: string): Promise<void> {
  await pipeline(createReadStream(compressedPath), createGunzip(), createWriteStream(jsonPath));
}
```

Keep credentials, access controls, integrity checks, and restore drills in your backup operations plan. Test recovery against an isolated Firebase project before relying on it in production.
