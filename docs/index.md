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
[View on GitHub](https://github.com/migration-script-runner/msr-firebase){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[MSR Core Docs](https://migration-script-runner.github.io/msr-core){: .btn .fs-5 .mb-4 .mb-md-0 }

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
- **Transaction Support** - Callback-based transactions for Firebase Realtime Database
- **Backup & Restore** - Built-in backup and restore functionality
- **CLI Ready** - Complete command-line interface with `msr-firebase` command

---

## Why MSR Firebase?

**Bring your own database.** MSR Firebase provides a lightweight, flexible framework for managing Firebase Realtime Database migrations without locking you into a specific ORM or pattern.

### Perfect for

- 🔥 **Firebase Realtime Database** - Native support for Firebase-specific features
- 🎯 **Production applications** - Returns structured results instead of calling `process.exit()`
- 🛡️ **Type-safe migrations** - Full TypeScript support with type definitions
- 📦 **Library or CLI** - Use as a library in your app or run from command line
- ⚡ **Flexible workflows** - Multiple rollback strategies, validation, and hooks

### Key Advantages

1. **Database-Agnostic Core** - Built on proven MSR Core architecture
2. **Firebase Native** - Optimized for Firebase Realtime Database operations
3. **Production Ready** - Used in real-world applications
4. **Well Tested** - Comprehensive test coverage with Firebase emulator support
5. **Developer Friendly** - Clear API, detailed documentation, helpful error messages

---

## Quick Example

### 1. Setup Environment

Create `.env` file with minimal configuration:

```bash
# .env
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
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
import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';

// Configure
const appConfig = new AppConfig();
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
# Run all pending migrations
npx msr-firebase migrate

# Rollback last migration
npx msr-firebase down

# Check status
npx msr-firebase list
```

---

## Documentation

### Getting Started
- [Getting Started](getting-started) - Quick start guide
- [Installation](installation) - Detailed setup instructions

### Guides
- [Writing Migrations](guides/writing-migrations) - Best practices for migrations
- [CLI Usage](guides/cli-usage) - Command-line interface guide
- [Configuration](guides/configuration) - Configuration options
- [Backup & Restore](guides/backup-restore) - Backup strategies
- [Testing](guides/testing) - Testing with Firebase emulator

### API Reference
- [FirebaseRunner](api/FirebaseRunner) - Main migration runner class
- [FirebaseHandler](api/FirebaseHandler) - Database handler
- [Services](api/services) - Firebase services
- [Interfaces](api/interfaces) - Core interfaces
- [Types](api/types) - TypeScript types

### Examples
- [Basic Usage](examples/basic-usage) - Simple examples
- [CLI Examples](examples/with-cli) - CLI usage patterns
- [Custom Commands](examples/custom-commands) - Custom scripts
- [Firebase Emulator](examples/firebase-emulator) - Testing with emulator

---

## About

MSR Firebase is part of the [Migration Script Runner](https://github.com/migration-script-runner) ecosystem, providing database migration tooling for various database systems.

### License

Distributed under the MIT License. See `LICENSE` for more information.

### Links

- [GitHub Repository](https://github.com/migration-script-runner/msr-firebase)
- [npm Package](https://www.npmjs.com/package/@migration-script-runner/firebase)
- [MSR Core Documentation](https://migration-script-runner.github.io/msr-core)
