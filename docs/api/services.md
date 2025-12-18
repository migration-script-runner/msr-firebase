---
layout: default
title: Services
parent: API Reference
nav_order: 3
---

# Services
{: .no_toc }

Firebase data and entity service implementations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## FirebaseDataService

Interface for Firebase data operations.

### Methods

#### get()

Retrieves data from a Firebase path.

```typescript
get<T>(path: string): Promise<T | null>
```

#### set()

Sets data at a Firebase path.

```typescript
set<T>(path: string, data: T): Promise<void>
```

#### update()

Updates data at a Firebase path.

```typescript
update(path: string, data: object): Promise<void>
```

#### remove()

Removes data at a Firebase path.

```typescript
remove(path: string): Promise<void>
```

#### transaction()

Executes a transaction.

```typescript
transaction<T>(
  path: string,
  updateFn: (current: T) => T
): Promise<{ committed: boolean; snapshot: DataSnapshot }>
```

## FirebaseDataServiceImpl

Implementation of `FirebaseDataService`.

### Constructor

```typescript
constructor(db: admin.database.Database)
```

### Usage Example

```typescript
import { FirebaseDataServiceImpl } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

const dataService = new FirebaseDataServiceImpl(admin.database());

// Get data
const users = await dataService.get('users');

// Set data
await dataService.set('users/user1', { name: 'John' });

// Update data
await dataService.update('users/user1', { email: 'john@example.com' });

// Remove data
await dataService.remove('users/user1');
```

---

## EntityService

Interface for entity management operations.

### Methods

#### getAll()

Retrieves all entities.

```typescript
getAll<T>(): Promise<T[]>
```

#### getById()

Retrieves entity by ID.

```typescript
getById<T>(id: string): Promise<T | null>
```

#### create()

Creates a new entity.

```typescript
create<T>(entity: T): Promise<void>
```

#### update()

Updates an existing entity.

```typescript
update<T>(id: string, entity: Partial<T>): Promise<void>
```

#### delete()

Deletes an entity.

```typescript
delete(id: string): Promise<void>
```

## EntityServiceImpl

Implementation of `EntityService` for Firebase migrations tracking.

### Constructor

```typescript
constructor(
  firebaseDataService: FirebaseDataService,
  entityPath: string = 'migrations'
)
```

### Parameters

- **firebaseDataService**: Firebase data service instance
- **entityPath**: Firebase path for storing entities (default: 'migrations')

### Usage Example

```typescript
import { EntityServiceImpl, FirebaseDataServiceImpl } from '@migration-script-runner/firebase';

const dataService = new FirebaseDataServiceImpl(admin.database());
const entityService = new EntityServiceImpl(dataService, 'migrations');

// Get all migrations
const migrations = await entityService.getAll();

// Get specific migration
const migration = await entityService.getById('1234567890');

// Create migration record
await entityService.create({
  timestamp: 1234567890,
  name: 'create-users',
  appliedAt: new Date()
});

// Delete migration record
await entityService.delete('1234567890');
```

## See Also

- [FirebaseHandler](FirebaseHandler) - Uses these services
- [Interfaces](interfaces) - Service interfaces
- [Types](types) - Type definitions
