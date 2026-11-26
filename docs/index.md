---
layout: default
title: Home
nav_order: 1
description: "Firebase implementation for Migration Script Runner - Database migrations for Firebase Realtime Database"
permalink: /
---

# MSR: Firebase
{: .fs-9 }

Database migrations for Firebase Realtime Database with full TypeScript support.
{: .fs-6 .fw-300 }

[Get started now]({% link getting-started.md %}){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/migration-script-runner/msr-firebase){: .btn .fs-5 .mb-4 .mb-md-0 }

---

<div style="background: linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%); padding: 32px; border-radius: 12px; border-left: 6px solid #5c6bc0; margin: 40px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <div style="display: flex; gap: 24px; align-items: start;">
    <img src="https://github.com/migration-script-runner.png" alt="MSR" style="width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0;">
    <div style="flex: 1;">
      <h3 style="color: #3f51b5; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Part of the MSR Ecosystem</h3>
      <p style="color: #7e57c2; font-size: 14px; font-weight: 500; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Powered by MSR Core</p>
      <p style="color: #5f6368; line-height: 1.7; margin: 0 0 20px 0; font-size: 15px;">
        MSR Firebase is part of the <strong>Migration Script Runner family</strong> - a suite of database-specific migration tools built on a proven, battle-tested core. Inherits enterprise features like <strong>migration locking</strong> for distributed deployments, <strong>checksum validation</strong>, <strong>multiple rollback strategies</strong>, and comprehensive logging. Firebase-specific features and optimizations added on top.
      </p>
      <a href="https://migration-script-runner.dev/ecosystem" style="display: inline-block; background: #5c6bc0; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; transition: background 0.2s;">
        Explore the MSR Ecosystem →
      </a>
    </div>
  </div>
</div>

---

MSR Firebase provides a complete migration solution for Firebase Realtime Database, built on top of [Migration Script Runner Core](https://core.migration-script-runner.dev).
{: .warning }

### Quick Installation

```bash
npm install @migration-script-runner/firebase
```

---

## Key Features

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 32px 0;">

  <div style="background: #e8f5e9; padding: 24px; border-radius: 8px; border-left: 4px solid #66bb6a;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">🔒</span>
      <div>
        <h3 style="color: #2e7d32; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">Migration Locking</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Production ready</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">Perfect for Kubernetes, Docker, and multi-instance deployments. Prevents race conditions with automatic lock expiration and force-release commands.</p>
  </div>

  <div style="background: #e1f5fe; padding: 24px; border-radius: 8px; border-left: 4px solid #29b6f6;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">💾</span>
      <div>
        <h3 style="color: #0277bd; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">Backup & Restore</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Automatic protection</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">Automatic backups before migrations with flexible restore options. Protect your data with multiple backup modes and point-in-time recovery.</p>
  </div>

  <div style="background: #fff3e0; padding: 24px; border-radius: 8px; border-left: 4px solid #ffa726;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">🔥</span>
      <div>
        <h3 style="color: #e65100; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">Firebase Native</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Optimized for Firebase</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">Built specifically for Firebase Realtime Database with support for single-node transactions, path prefixing, and full Firebase Admin SDK features.</p>
  </div>

  <div style="background: #fce4ec; padding: 24px; border-radius: 8px; border-left: 4px solid #ec407a;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">🛡️</span>
      <div>
        <h3 style="color: #c2185b; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">Type-Safe Migrations</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Full TypeScript support</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">First-class TypeScript support with full type definitions. Write migrations with confidence using generic type parameters and interfaces.</p>
  </div>

  <div style="background: #f3e5f5; padding: 24px; border-radius: 8px; border-left: 4px solid #ab47bc;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">🧪</span>
      <div>
        <h3 style="color: #6a1b9a; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">Emulator Support</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Test before deploy</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">Test migrations locally with Firebase Emulator before deploying to production. Complete integration test support with isolated environments.</p>
  </div>

  <div style="background: #e8eaf6; padding: 24px; border-radius: 8px; border-left: 4px solid #5c6bc0;">
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px; line-height: 1;">📦</span>
      <div>
        <h3 style="color: #3f51b5; font-size: 20px; font-weight: 600; margin: 0 0 4px 0;">CLI & Library</h3>
        <p style="color: #9e9e9e; font-size: 12px; margin: 0;">Use your way</p>
      </div>
    </div>
    <p style="color: #5f6368; line-height: 1.6; margin: 0; font-size: 14px;">Use as a command-line tool for quick migrations or integrate programmatically into your Node.js application. Same powerful features, your choice.</p>
  </div>

</div>

**[→ View all features](features)** - Complete feature list with detailed descriptions
{: .fs-5 }

{: .warning }
**Important:** Firebase Realtime Database does NOT support database-wide transactions. Unlike SQL databases or MongoDB, Firebase only supports atomic operations on a **single node**. This is a Firebase platform limitation, not an MSR Firebase limitation. See the [Transaction Guide](writing-migrations/transactions) for safe migration patterns and workarounds.

---

## Quick Example

### 1. Setup Credentials

You can provide Firebase credentials in two ways:

**Option A: CLI Flags (Recommended for quick start)**
```bash
npx msr-firebase migrate \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./serviceAccountKey.json
```

**Option B: Environment Variables**
```bash
# .env
DATABASE_URL=https://DATABASE-NAME.REGION.firebasedatabase.app
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 2. Write a Migration

Create migrations as TypeScript classes with full type safety:

> **Real Example:** This pattern is used in our [integration tests](https://github.com/migration-script-runner/msr-firebase/blob/master/test/integration/migrations/V202501010001_create_users.ts) and verified in production.

```typescript
// migrations/V202501010001_create_users.ts
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler } from '@migration-script-runner/firebase';

export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    // Access database with full type safety
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));

    await usersRef.set({
      user1: { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      user2: { name: 'Bob', email: 'bob@example.com', role: 'user' }
    });

    return 'Created users table with 2 initial users';
  }

  async down(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('users')).remove();
    return 'Removed users table';
  }
}
```

**Advanced: Using EntityService for type-safe entity operations**

> See [smoke tests](https://github.com/migration-script-runner/msr-firebase/blob/master/test/integration/smoke.test.ts) for a complete workflow example running these migrations.

```typescript
// migrations/V202501010002_add_posts.ts
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler, EntityService } from '@migration-script-runner/firebase';
import type { IEntity } from '@migration-script-runner/firebase';

interface Post extends IEntity {
  title: string;
  author: string;
  createdAt: number;
}

export default class AddPosts implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const postService = new EntityService<Post>(
      db.database,
      handler.cfg.buildPath('posts')
    );

    // Create posts with type safety
    await postService.create({
      title: 'First Post',
      author: 'user1',
      createdAt: Date.now()
    });

    return 'Created posts collection';
  }

  async down(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('posts')).remove();
    return 'Removed posts collection';
  }
}
```

### 3. Run Migrations

**As a Library:**

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

// Configure
const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize runner (handler creation is automatic)
const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Run migrations
const result = await runner.migrate();
if (!result.success) {
  console.error('Migration failed:', result.errors);
} else {
  console.log(`Applied ${result.executed.length} migrations`);
}

// Roll back migrations newer than the chosen numeric target version
await runner.down(202501010001)
```

**With CLI:**

```bash
# Run with inline credentials (easiest)
npx msr-firebase migrate \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./serviceAccountKey.json

# Or use environment variables
npx msr-firebase migrate

# Roll back to the chosen target version
npx msr-firebase down 202501010001

# Check status
npx msr-firebase list --format table
```

---

**Created with ❤️ by [Volodymyr Lavrynovych](https://github.com/vlavrynovych) in Ukraine 🇺🇦**
