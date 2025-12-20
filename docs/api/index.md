---
layout: default
title: API Reference
nav_order: 5
has_children: true
---

# API Reference

Complete API documentation for MSR Firebase classes, interfaces, and services.

## Main Classes

These are the primary classes for using MSR Firebase:

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

## Getting Started

For practical usage examples, see:

- **[Library Usage Quick Start](../library-usage/quick-start)** - Programmatic usage examples
- **[CLI Usage](../cli-usage/)** - Command-line interface documentation

## External Documentation

For inherited functionality and core concepts, see:

- [MSR Core API Documentation](https://migration-script-runner.github.io/msr-core/api) - Base classes and interfaces
- [MSR Core MigrationScriptExecutor](https://migration-script-runner.github.io/msr-core/api/core-classes#migrationscriptexecutor) - Inherited migration methods
- [MSR Core Config](https://migration-script-runner.github.io/msr-core/api/models#config) - Base configuration options

---

{: .note }
> MSR Firebase focuses on consumer API documentation. Internal implementation details (handlers, adapters) are not documented here as they're managed automatically by the framework.
