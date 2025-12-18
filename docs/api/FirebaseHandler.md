---
layout: default
title: FirebaseHandler
parent: API Reference
nav_order: 1
---

# FirebaseHandler
{: .no_toc }

Database handler implementation for Firebase Realtime Database.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`FirebaseHandler` implements the `IDatabaseHandler` interface from MSR Core, providing Firebase-specific implementations for migration tracking, backup, and restore operations.

## Class Signature

```typescript
class FirebaseHandler implements IDatabaseHandler<admin.database.Database>
```

## Constructor

```typescript
constructor(
  firebaseDataService: FirebaseDataService,
  entityService: EntityService
)
```

### Parameters

- **firebaseDataService**: Service for Firebase data operations
- **entityService**: Service for entity management

## Methods

### connect()

Establishes connection to Firebase Realtime Database.

```typescript
async connect(): Promise<void>
```

### disconnect()

Closes the Firebase connection.

```typescript
async disconnect(): Promise<void>
```

### getAppliedMigrations()

Retrieves list of applied migrations from Firebase.

```typescript
async getAppliedMigrations(): Promise<ISchemaVersion[]>
```

**Returns**: Array of applied migration records

### saveMigration()

Saves a migration record to Firebase.

```typescript
async saveMigration(migration: ISchemaVersion): Promise<void>
```

**Parameters**:
- **migration**: Migration record to save

### deleteMigration()

Removes a migration record from Firebase.

```typescript
async deleteMigration(timestamp: number): Promise<void>
```

**Parameters**:
- **timestamp**: Migration timestamp to delete

### backup()

Creates a backup of the entire Firebase database.

```typescript
async backup(): Promise<string>
```

**Returns**: Backup identifier

### restore()

Restores Firebase database from a backup.

```typescript
async restore(backupId: string): Promise<void>
```

**Parameters**:
- **backupId**: Identifier of the backup to restore

## Usage Example

```typescript
import { FirebaseHandler } from '@migration-script-runner/firebase';
import { FirebaseDataServiceImpl, EntityServiceImpl } from '@migration-script-runner/firebase';

const dataService = new FirebaseDataServiceImpl(admin.database());
const entityService = new EntityServiceImpl(dataService);
const handler = new FirebaseHandler(dataService, entityService);

// Get applied migrations
const migrations = await handler.getAppliedMigrations();
console.log('Applied migrations:', migrations);
```

## See Also

- [FirebaseRunner](FirebaseRunner) - Main migration runner class
- [Services](services) - Firebase data and entity services
- [Interfaces](interfaces) - Core interfaces
