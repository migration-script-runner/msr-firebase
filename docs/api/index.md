---
layout: default
title: API Reference
nav_order: 4
has_children: true
---

# API Reference

Complete API documentation for MSR Firebase consumer-facing classes and interfaces.

## Consumer API

These are the classes you'll use when consuming MSR Firebase:

### [FirebaseRunner](FirebaseRunner)

Main migration runner class for executing Firebase Realtime Database migrations.

- Factory method: `getInstance()`
- Firebase-specific methods: `getConnectionInfo()`, `getDatabase()`, `listNodes()`, `backupNodes()`
- Inherits all migration methods from [MSR Core MigrationScriptExecutor](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor)

### [FirebaseConfig](FirebaseConfig)

Configuration class for Firebase connection and migration settings.

- Firebase properties: `databaseUrl`, `applicationCredentials`, `shift`
- Migration settings: `folder`, `tableName`, `locking`
- Utility methods: `buildPath()`, `getRoot()`

## Migration Writing API

### [Interfaces](interfaces)

TypeScript interfaces used when writing migrations:

- **IFirebaseDB** - Database interface passed to migration scripts
- **FirebaseHandler** - Handler interface (accessed via `runner.getHandler()` if needed)

### [Services](services)

Optional helper services for Firebase operations within migrations:

- **EntityService** - CRUD operations for typed entities
- **FirebaseDataService** - Low-level Firebase data operations

## Type Definitions

### [Types](types)

TypeScript type definitions and utilities for Firebase migrations.

---

## Quick Start

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

// 1. Configure
const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

// 2. Create runner
const runner = await FirebaseRunner.getInstance({ config });

// 3. Run migrations
await runner.migrate();
```

## External Documentation

For inherited functionality and core concepts, see:

- [MSR Core API Documentation](https://migration-script-runner.github.io/msr-core/api) - Base classes and interfaces
- [MSR Core MigrationScriptExecutor](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor) - Inherited migration methods
- [MSR Core Config](https://migration-script-runner.github.io/msr-core/api/models#config) - Base configuration options

---

{: .note }
> MSR Firebase focuses on consumer API documentation. Internal implementation details (handlers, adapters) are not documented here as they're managed automatically by the framework.
