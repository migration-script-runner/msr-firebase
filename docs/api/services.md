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

Type-safe service for managing entities in Firebase Realtime Database. Provides CRUD operations, batch updates, and query capabilities with generic type support.

{: .tip }
> **Perfect for migrations!** EntityService is specifically designed for use in migration scripts, providing a clean, type-safe API for working with collections of entities.

### Constructor

```typescript
constructor(
  db: admin.database.Database,
  root: string
)
```

**Parameters:**
- `db` - Firebase Realtime Database instance (from `IFirebaseDB.database`)
- `root` - Root path for the entity collection (use `handler.cfg.buildPath()`)

### Type Parameter

EntityService uses a generic type parameter `T extends IEntity`:

```typescript
interface IEntity {
  key?: string;  // Firebase auto-generated key
}

// Define your entity type
interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Create type-safe service
const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));
```

### Methods

#### getAll()

Retrieves all entities from the collection as an array.

```typescript
getAll(): Promise<T[]>
```

**Returns:** Promise resolving to array of entities (each includes `key` property)

**Example:**
```typescript
const users = await userService.getAll();
console.log(`Found ${users.length} users`);
```

#### getAllAsObject()

Retrieves all entities as an object with keys as properties.

```typescript
getAllAsObject(): Promise<Record<string, T>>
```

**Returns:** Promise resolving to object containing all entities

**Example:**
```typescript
const usersObject = await userService.getAllAsObject();
const user = usersObject['user-key-123'];
```

#### get()

Retrieves a single entity by its key.

```typescript
get(key: string): Promise<T | null>
```

**Parameters:**
- `key` - Firebase key of the entity

**Returns:** Promise resolving to entity or null if not found

**Example:**
```typescript
const user = await userService.get('user-key-123');
if (user) {
  console.log(user.name);
}
```

#### create()

Creates a new entity with auto-generated Firebase key.

```typescript
create(obj: T): Promise<string>
```

**Parameters:**
- `obj` - Entity object (key will be auto-generated)

**Returns:** Promise resolving to the newly created entity's key

**Example:**
```typescript
const newKey = await userService.create({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});
```

#### save()

Smart save that creates if no key, updates if key present.

```typescript
save(obj: T): Promise<string>
```

**Parameters:**
- `obj` - Entity object (with or without key)

**Returns:** Promise resolving to entity key (existing or new)

**Example:**
```typescript
// Create (no key)
const key1 = await userService.save({ name: 'Bob', email: 'bob@example.com', role: 'user' });

// Update (with key)
const key2 = await userService.save({ key: 'user-123', name: 'Bob Updated', email: 'bob@example.com', role: 'user' });
```

#### update()

Updates an existing entity (merges with existing data).

```typescript
update(key: string, obj: Partial<T>): Promise<string>
```

**Parameters:**
- `key` - Firebase key of the entity to update
- `obj` - Partial or complete entity object

**Returns:** Promise resolving to the entity key

**Example:**
```typescript
await userService.update('user-key-123', {
  email: 'newemail@example.com',
  updatedAt: Date.now()
});
```

#### set()

Sets (replaces) an entity completely.

```typescript
set(key: string, obj: T): Promise<string>
```

**Parameters:**
- `key` - Firebase key of the entity to set
- `obj` - Complete entity object (overwrites existing)

**Returns:** Promise resolving to the entity key

**Example:**
```typescript
await userService.set('user-key-123', {
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin'
});
```

#### remove()

Removes a single entity by key.

```typescript
remove(key: string): Promise<string>
```

**Parameters:**
- `key` - Firebase key of the entity to remove

**Returns:** Promise resolving to the removed entity's key

**Example:**
```typescript
await userService.remove('user-key-123');
```

#### removeByIds()

Removes multiple entities in parallel.

```typescript
removeByIds(ids: string[]): Promise<void>
```

**Parameters:**
- `ids` - Array of Firebase keys to remove

**Example:**
```typescript
await userService.removeByIds(['key1', 'key2', 'key3']);
```

#### removeAll()

Removes all entities in the collection.

{: .warning }
> **Destructive operation!** This cannot be undone.

```typescript
removeAll(): Promise<void>
```

**Example:**
```typescript
await userService.removeAll(); // Use with caution!
```

#### findAllBy()

Finds entities where a property matches a value.

```typescript
findAllBy(propertyName: string, value: number | string | boolean | null): Promise<T[]>
```

**Parameters:**
- `propertyName` - Property name to query
- `value` - Value to match

**Returns:** Promise resolving to array of matching entities

**Example:**
```typescript
// Find all admin users
const admins = await userService.findAllBy('role', 'admin');

// Find verified users
const verified = await userService.findAllBy('verified', true);
```

#### updateAll()

Batch updates all entities using an update function.

```typescript
updateAll(updateFn: (entity: T) => boolean): Promise<ModificationResults>
```

**Parameters:**
- `updateFn` - Function that modifies entity and returns `true` if modified, `false` if skipped

**Returns:** Promise resolving to `ModificationResults` with `updated` and `skipped` arrays

**Example:**
```typescript
const results = await userService.updateAll((user) => {
  if (user.verified !== undefined) {
    return false; // Skip - already has field
  }
  user.verified = false; // Add field
  return true; // Modified
});

console.log(`Updated: ${results.updated.length}, Skipped: ${results.skipped.length}`);
```

### Complete Migration Example

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler, EntityService, IEntity } from '@migration-script-runner/firebase';

interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user';
  verified?: boolean;
}

export default class AddVerifiedField implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(
      db.database,
      handler.cfg.buildPath('users')
    );

    const results = await userService.updateAll((user) => {
      if (user.verified !== undefined) return false;
      user.verified = false;
      return true;
    });

    return `Added verified field to ${results.updated.length} users`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(
      db.database,
      handler.cfg.buildPath('users')
    );

    const results = await userService.updateAll((user) => {
      if (user.verified === undefined) return false;
      delete user.verified;
      return true;
    });

    return `Removed verified field from ${results.updated.length} users`;
  }
}
```

---

## See Also

- **[Using EntityService Guide](../writing-migrations/using-entityservice)** - Complete guide with examples
- **[Migration Scripts](../writing-migrations/migration-scripts)** - Writing migrations
- **[IEntity Interface](interfaces#ientity)** - Entity interface definition
