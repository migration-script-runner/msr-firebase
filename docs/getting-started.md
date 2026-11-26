---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Install MSR Firebase, connect it to Firebase Realtime Database, and run your first migration.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Before you begin

- Node.js `22.13.0` or later and npm.
- A Firebase project with Realtime Database enabled.
- A Firebase service-account JSON key file and the Realtime Database URL.

You can find the database URL in your Firebase project settings. Keep service-account keys out of source control; add any local key file to `.gitignore`.

---

## Install MSR Firebase

```bash
npm install @migration-script-runner/firebase
```

---

## Create a migration script

Create the migrations folder and add a versioned file. See [Writing Migration Scripts](writing-migrations/migration-scripts) for naming rules and more patterns.

```bash
mkdir migrations
```

For example, create `migrations/V202611251200_create_settings.ts`:

```typescript
import type { IMigrationInfo, IRunnableScript } from '@migration-script-runner/core';
import type { FirebaseHandler, IFirebaseDB } from '@migration-script-runner/firebase';

export default class CreateSettings implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('settings')).set({ maintenance: false });
    return `Created settings in ${info.name}`;
  }
}
```

Add a `down()` method when you need the migration to support rollback. Firebase transactions are atomic at a single database node; see [Firebase Transactions](writing-migrations/transactions) for this limitation and safe patterns.

---

## Configure Firebase credentials

Set the database URL and the path to your service-account JSON key file:

```bash
export DATABASE_URL="<your-Realtime-Database-URL>"
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
```

The current Firebase adapter requires this credential file; it does not use Application Default Credentials when the path is omitted. See [CLI Configuration](cli-usage/configuration) for config files, environment variables, and command-line options.

---

## Run migrations

First check that the CLI can connect, then apply pending migrations:

```bash
npx msr-firebase firebase:test-connection
npx msr-firebase migrate --folder ./migrations
```

For the available commands and options, see [CLI Commands](cli-usage/commands).

---

## Run migrations from your application

Use `FirebaseRunner` when migrations should run from Node.js application code:

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.folder = './migrations';
const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

`FirebaseConfig` reads `DATABASE_URL` and `GOOGLE_APPLICATION_CREDENTIALS` from the process environment. See [Library Usage](library-usage/) for configuration, results, and error handling.

---

## Next steps

- [CLI Usage](cli-usage/) — configure the CLI and review its commands.
- [Library Usage](library-usage/) — integrate migrations into a Node.js application.
- [Writing Migrations](writing-migrations/) — build reversible migrations and follow Firebase-specific practices.
- [Testing](writing-migrations/testing) — test against the Firebase Realtime Database Emulator.
- [Backup and Restore](writing-migrations/backup-restore) — choose a backup and recovery approach.
- [API Reference](api/) — explore Firebase-specific classes, interfaces, and types.
