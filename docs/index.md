---
layout: default
title: Home
nav_order: 1
description: "Firebase implementation for Migration Script Runner - Database migrations for Firebase Realtime Database"
permalink: /
---

# MSR: Firebase
{: .fs-9 }

Firebase implementation v{{ site.package_version }} for Migration Script Runner v{{ site.msr_core_version }} - Database migrations for Firebase Realtime Database.
{: .fs-6 .fw-300 }

[Get started now](#getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View all features](features){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/migration-script-runner/msr-firebase){: .btn .fs-5 .mb-4 .mb-md-0 }

---

{: .warning }
**⚠️ Unstable Version:** Version v0.2.0 is currently unstable and **not recommended for production use**. The project is under active development and may receive significant updates. Please use with caution and test thoroughly before deploying to production environments.

---

## Getting Started

MSR Firebase provides a complete migration solution for Firebase Realtime Database, built on top of [Migration Script Runner Core](https://migration-script-runner.github.io/msr-core).

### Quick Installation

```bash
npm install @migration-script-runner/firebase
```

### Features

- **Full MSR Core Integration** - All standard migration operations (migrate, list, down, validate, backup)
- **Firebase-Specific Commands** - Custom CLI commands for Firebase operations
- **TypeScript Support** - First-class TypeScript support with full type definitions
- **Single-Node Transactions** - Atomic operations via Firebase's `ref.transaction()`
- **Backup & Restore** - Built-in backup and restore functionality
- **CLI Ready** - Complete command-line interface with `msr-firebase` command

{: .warning }
**Important:** Firebase Realtime Database does NOT support database-wide transactions. Unlike SQL databases or MongoDB, Firebase only supports atomic operations on a **single node**. This is a Firebase platform limitation, not an MSR Firebase limitation. See the [Transaction Guide](writing-migrations/transactions) for safe migration patterns and workarounds.

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

---

## Quick Example

### 1. Setup Credentials

You can provide Firebase credentials in two ways:

**Option A: CLI Flags (Recommended for quick start)**
```bash
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

**Option B: Environment Variables**
```bash
# .env
DATABASE_URL=https://your-project.firebaseio.com
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

interface Post {
  key?: string;
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
console.log(`Applied ${result.executed.length} migrations`);

// Rollback if needed
await runner.down();
```

**With CLI:**

```bash
# Run with inline credentials (easiest)
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json

# Or use environment variables
npx msr-firebase migrate

# Rollback last migration
npx msr-firebase down

# Check status
npx msr-firebase list --format table
```

---

## Documentation

### Getting Started
- **[Getting Started](getting-started)** - Installation and quick start guide
- **[Features](features)** - Complete feature list and comparison

### Using MSR Firebase

#### [CLI Usage](cli-usage/)
Complete command-line interface documentation:
- [Commands](cli-usage/commands) - Firebase-specific and inherited commands
- [Configuration](cli-usage/configuration) - CLI flags and options
- [Examples](cli-usage/examples) - Real-world CLI workflows
- [CI/CD Integration](cli-usage/ci-cd) - Pipeline integration

#### [Library Usage](library-usage/)
Programmatic API documentation:
- [Quick Start](library-usage/quick-start) - Get started with the API
- [Configuration](library-usage/configuration) - Programmatic configuration
- [Examples](library-usage/examples) - Advanced usage patterns

#### [API Reference](api/)
Complete API documentation:
- [FirebaseRunner](api/FirebaseRunner) - Main migration runner
- [FirebaseConfig](api/FirebaseConfig) - Configuration class
- [Services](api/services) - Helper services
- [Interfaces](api/interfaces) - TypeScript interfaces

### Writing Migrations

#### [Writing Migrations](writing-migrations/)
Complete guide to writing migration scripts:
- [Migration Scripts](writing-migrations/migration-scripts) - File structure and patterns
- [Transactions](writing-migrations/transactions) - Understanding Firebase limitations
- [Backup & Restore](writing-migrations/backup-restore) - Protecting your data
- [Testing](writing-migrations/testing) - Testing with Firebase Emulator
- [Migration Locking](writing-migrations/migration-locking) - Distributed environments
- [Best Practices](writing-migrations/best-practices) - Firebase-specific patterns

---

## About

MSR Firebase is part of the [Migration Script Runner](https://github.com/migration-script-runner) ecosystem, providing database migration tooling for various database systems.

---

## License

This project is licensed under the **MIT License with Commons Clause and Attribution Requirements**.

Based on [Migration Script Runner Core](https://github.com/migration-script-runner/msr-core) by Volodymyr Lavrynovych.

### Quick Summary

- ✅ **Free to use** in your applications (including commercial)
- ✅ **Free to modify** and contribute
- ❌ **Cannot sell** this adapter or Firebase-specific extensions as standalone products
- 🔒 **Attribution required** for Firebase migration extensions

See the [LICENSE](https://github.com/migration-script-runner/msr-firebase/blob/master/LICENSE) file and [NOTICE](https://github.com/migration-script-runner/msr-firebase/blob/master/NOTICE) file for detailed examples and FAQ.

---

## Links

- [GitHub Repository](https://github.com/migration-script-runner/msr-firebase)
- [npm Package](https://www.npmjs.com/package/@migration-script-runner/firebase)
- [MSR Core Documentation](https://migration-script-runner.github.io/msr-core)
- [Report Issues](https://github.com/migration-script-runner/msr-firebase/issues)

---

**Created with ❤️ by [Volodymyr Lavrynovych](https://github.com/vlavrynovych) in Ukraine 🇺🇦**
