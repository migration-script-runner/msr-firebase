---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Quick start guide to get up and running with MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Prerequisites

- Node.js 16.x or higher
- Firebase project with Realtime Database enabled
- Firebase Admin SDK credentials

## Installation

Install MSR Firebase via npm:

```bash
npm install @migration-script-runner/firebase
```

## Quick Start

### 1. Setup Firebase Admin SDK

Create a service account key from your Firebase project and initialize:

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('path/to/serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});
```

### 2. Create Your First Migration

Create a migrations directory and your first migration file:

```typescript
// migrations/001-create-users.ts
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({
    user1: { name: 'John Doe', email: 'john@example.com' }
  });
};

export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  await db.ref('users').remove();
};
```

### 3. Run Migrations

Using the CLI:

```bash
npx msr-firebase migrate
```

Or programmatically:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });
await runner.migrate();
```

## Next Steps

- [Installation Guide](installation) - Detailed installation instructions
- [Writing Migrations](guides/writing-migrations) - Learn migration best practices
- [CLI Usage](guides/cli-usage) - Complete CLI command reference
- [API Reference](api/) - Full API documentation

## See Also

- [MSR Core Documentation](https://migration-script-runner.github.io/msr-core)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
