---
layout: default
title: API Reference
nav_order: 6
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
- Inherits all migration methods from [MSR Core MigrationScriptRunner](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner)

### [FirebaseConfig](FirebaseConfig)

Configuration class for Firebase connection and migration settings.

- Firebase properties: `databaseUrl`, `applicationCredentials`, `shift`, `backupPaths`
- Migration settings: `folder`, `tableName`, `locking`
- Utility methods: `buildPath()`, `getRoot()`

## Migration Writing API

### [Migration Interfaces](interfaces)

TypeScript interfaces used when writing migrations:

- **IFirebaseDB** - Database interface passed to migration scripts
- **FirebaseHandler** - Handler class passed to migration scripts (available from `runner.getHandler()` when needed)

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

- [MSR Core API Documentation](https://core.migration-script-runner.dev/api) - Base classes and interfaces
- [MSR Core MigrationScriptRunner](https://core.migration-script-runner.dev/api/core-classes#migrationscriptrunner) - Inherited migration methods
- [MSR Core Config](https://core.migration-script-runner.dev/api/models#config) - Base configuration options

---

{: .note }
> MSR Firebase focuses on consumer API documentation. Internal implementation details (handlers, adapters) are not documented here as they're managed automatically by the framework.
