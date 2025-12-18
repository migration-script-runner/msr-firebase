---
layout: default
title: Home
nav_order: 1
description: "Firebase adapter for Migration Script Runner - Database migrations for Firebase Realtime Database"
permalink: /
---

# MSR Firebase
{: .fs-9 }

Firebase adapter for Migration Script Runner - Database migrations for Firebase Realtime Database.
{: .fs-6 .fw-300 }

[Get started now](#getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/migration-script-runner/msr-firebase){: .btn .fs-5 .mb-4 .mb-md-0 }

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

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://your-project.firebaseio.com'
});

// Create runner and migrate
const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations'
});

await runner.migrate();
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
