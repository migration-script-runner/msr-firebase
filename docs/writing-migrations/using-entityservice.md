---
layout: default
title: Using EntityService
parent: Writing Migrations
nav_order: 8
---

# Using EntityService
{: .no_toc }

Type-safe entity operations for Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## What is EntityService?

`EntityService` is a type-safe, CRUD-focused wrapper around Firebase Realtime Database operations designed specifically for use in migrations. It provides:

- 🛡️ **Type Safety** - Generic type parameters for compile-time type checking
- 🎯 **Clean API** - Simple CRUD methods instead of raw Firebase references
- 📦 **Batch Operations** - Built-in support for updating multiple entities
- 🔍 **Query Support** - Find entities by property values
- ✨ **Smart Save** - Automatic create or update based on entity key

{: .tip }
> **When to use EntityService:** Use EntityService when working with collections of similar objects (users, posts, products, etc.). For simple key-value operations or complex transactions, use the raw Firebase API directly.

---

## Basic Setup

### Define Your Entity Type

All entities must extend the `IEntity` interface which provides the `key` property:

```typescript
import { IEntity } from '@migration-script-runner/firebase';

interface User extends IEntity {
  key?: string;  // From IEntity - Firebase auto-generated key
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: number;
}
```

### Create EntityService Instance

In your migration's `up()` or `down()` method:

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler, EntityService } from '@migration-script-runner/firebase';

export default class YourMigration implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    // Create EntityService for 'users' collection
    const userService = new EntityService<User>(
      db.database,
      handler.cfg.buildPath('users')
    );

    // Now use userService methods...
  }
}
```

{: .important }
> Always use `handler.cfg.buildPath()` to construct paths. This ensures path prefixing (shift) works correctly in multi-environment setups.

---

## CRUD Operations

### Create: Add New Entities

#### Create Single Entity

```typescript
const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

// Create returns the auto-generated key
const newKey = await userService.create({
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: Date.now()
});

console.log(`Created user with key: ${newKey}`);
```

#### Create Multiple Entities

```typescript
const newUsers = [
  { name: 'Bob', email: 'bob@example.com', role: 'user', createdAt: Date.now() },
  { name: 'Charlie', email: 'charlie@example.com', role: 'user', createdAt: Date.now() }
];

const keys = await Promise.all(
  newUsers.map(user => userService.create(user))
);

return `Created ${keys.length} users`;
```

### Read: Retrieve Entities

#### Get All Entities

```typescript
// Returns array of entities with keys
const allUsers = await userService.getAll();

console.log(`Found ${allUsers.length} users`);
allUsers.forEach(user => {
  console.log(`${user.key}: ${user.name}`);
});
```

#### Get All as Object

```typescript
// Returns object with keys as properties
const usersObject = await userService.getAllAsObject();

// Access by key: usersObject[key]
```

#### Get Single Entity by Key

```typescript
const user = await userService.get('user-key-123');

if (user) {
  console.log(`Found user: ${user.name}`);
} else {
  console.log('User not found');
}
```

#### Query by Property

```typescript
// Find all admin users
const admins = await userService.findAllBy('role', 'admin');

console.log(`Found ${admins.length} admins`);
```

### Update: Modify Existing Entities

#### Update Single Entity

```typescript
// Update specific fields
await userService.update('user-key-123', {
  email: 'newemail@example.com',
  updatedAt: Date.now()
});
```

#### Smart Save (Create or Update)

```typescript
const user: User = {
  key: 'user-key-123',  // If key exists, updates; if undefined, creates
  name: 'Alice Updated',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: Date.now()
};

const key = await userService.save(user);
```

#### Batch Update All Entities

```typescript
// Update function returns true if entity was modified
const results = await userService.updateAll((user) => {
  // Skip users who already have the field
  if (user.updatedAt) {
    return false; // Not modified
  }

  // Add updatedAt field
  user.updatedAt = Date.now();
  return true; // Modified
});

console.log(`Updated: ${results.updated.length}, Skipped: ${results.skipped.length}`);
```

### Delete: Remove Entities

#### Remove Single Entity

```typescript
await userService.remove('user-key-123');
```

#### Remove Multiple Entities

```typescript
const keysToRemove = ['key1', 'key2', 'key3'];
await userService.removeByIds(keysToRemove);
```

#### Remove All Entities

```typescript
// ⚠️ DANGER: Removes all entities in the collection
await userService.removeAll();
```

---

## Complete Migration Examples

### Example 1: Create Initial Data

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler, EntityService, IEntity } from '@migration-script-runner/firebase';

interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: number;
}

export default class CreateInitialUsers implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

    const users: Omit<User, 'key'>[] = [
      { name: 'Admin', email: 'admin@example.com', role: 'admin', createdAt: Date.now() },
      { name: 'User1', email: 'user1@example.com', role: 'user', createdAt: Date.now() },
      { name: 'User2', email: 'user2@example.com', role: 'user', createdAt: Date.now() }
    ];

    const keys = await Promise.all(users.map(user => userService.create(user)));

    return `Created ${keys.length} users`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));
    await userService.removeAll();
    return 'Removed all users';
  }
}
```

### Example 2: Add Field to All Entities

```typescript
interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user';
  verified?: boolean;  // New optional field
  createdAt: number;
}

export default class AddVerifiedField implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

    const results = await userService.updateAll((user) => {
      if (user.verified !== undefined) {
        return false; // Already has the field
      }
      user.verified = false;
      return true;
    });

    return `Added verified field to ${results.updated.length} users (skipped ${results.skipped.length})`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

    const results = await userService.updateAll((user) => {
      if (user.verified === undefined) {
        return false;
      }
      delete user.verified;
      return true;
    });

    return `Removed verified field from ${results.updated.length} users`;
  }
}
```

### Example 3: Data Migration Between Collections

```typescript
interface OldUser extends IEntity {
  fullName: string;
  emailAddress: string;
}

interface NewUser extends IEntity {
  firstName: string;
  lastName: string;
  email: string;
  migratedAt: number;
}

export default class MigrateUserStructure implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const oldUserService = new EntityService<OldUser>(db.database, handler.cfg.buildPath('old_users'));
    const newUserService = new EntityService<NewUser>(db.database, handler.cfg.buildPath('users'));

    const oldUsers = await oldUserService.getAll();

    const migrationPromises = oldUsers.map(async (oldUser) => {
      const [firstName, ...lastNameParts] = oldUser.fullName.split(' ');

      await newUserService.create({
        firstName,
        lastName: lastNameParts.join(' '),
        email: oldUser.emailAddress,
        migratedAt: Date.now()
      });
    });

    await Promise.all(migrationPromises);

    return `Migrated ${oldUsers.length} users from old structure to new structure`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const newUserService = new EntityService<NewUser>(db.database, handler.cfg.buildPath('users'));
    await newUserService.removeAll();
    return 'Removed migrated users';
  }
}
```

### Example 4: Conditional Updates

```typescript
interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user';
  lastLoginAt?: number;
  status?: 'active' | 'inactive';
}

export default class MarkInactiveUsers implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const results = await userService.updateAll((user) => {
      // Skip if already has status
      if (user.status) {
        return false;
      }

      // Mark as inactive if no login or old login
      if (!user.lastLoginAt || user.lastLoginAt < thirtyDaysAgo) {
        user.status = 'inactive';
      } else {
        user.status = 'active';
      }

      return true;
    });

    return `Updated ${results.updated.length} users with status`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

    const results = await userService.updateAll((user) => {
      if (!user.status) return false;
      delete user.status;
      return true;
    });

    return `Removed status from ${results.updated.length} users`;
  }
}
```

### Example 5: Query and Transform

```typescript
interface User extends IEntity {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  permissions?: string[];
}

export default class AddModeratorPermissions implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));

    // Find all moderators
    const moderators = await userService.findAllBy('role', 'moderator');

    // Add default permissions
    const updatePromises = moderators.map(async (mod) => {
      await userService.update(mod.key!, {
        permissions: ['read', 'write', 'moderate']
      });
    });

    await Promise.all(updatePromises);

    return `Added permissions to ${moderators.length} moderators`;
  }

  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));
    const moderators = await userService.findAllBy('role', 'moderator');

    const updatePromises = moderators.map(async (mod) => {
      await userService.update(mod.key!, { permissions: [] });
    });

    await Promise.all(updatePromises);

    return `Removed permissions from ${moderators.length} moderators`;
  }
}
```

---

## Best Practices

### 1. Always Use Type Parameters

```typescript
// ✅ GOOD: Type-safe operations
const userService = new EntityService<User>(db.database, path);
const user = await userService.get(key); // user is typed as User

// ❌ BAD: No type safety
const userService = new EntityService(db.database, path);
```

### 2. Handle Missing Entities

```typescript
const user = await userService.get(key);

if (!user) {
  throw new Error(`User ${key} not found`);
}

// Safe to use user here
console.log(user.name);
```

### 3. Use Batch Operations for Multiple Updates

```typescript
// ✅ GOOD: Single updateAll call
await userService.updateAll((user) => {
  user.verified = true;
  return true;
});

// ❌ BAD: Multiple individual updates (slower)
const users = await userService.getAll();
for (const user of users) {
  await userService.update(user.key!, { verified: true });
}
```

### 4. Make Migrations Idempotent

```typescript
// ✅ GOOD: Check before modifying
const results = await userService.updateAll((user) => {
  if (user.verified !== undefined) {
    return false; // Already has field
  }
  user.verified = false;
  return true;
});

// ❌ BAD: Overwrites every time
await userService.updateAll((user) => {
  user.verified = false;
  return true;
});
```

### 5. Use Path Prefixing

```typescript
// ✅ GOOD: Uses buildPath for multi-environment support
const userService = new EntityService<User>(
  db.database,
  handler.cfg.buildPath('users')
);

// ❌ BAD: Hardcoded path won't work with shift configuration
const userService = new EntityService<User>(db.database, 'users');
```

---

## EntityService vs Raw Firebase API

### When to Use EntityService

- ✅ Working with collections of similar objects
- ✅ Need type safety and IDE autocomplete
- ✅ Performing CRUD operations on entities
- ✅ Batch updating multiple entities
- ✅ Querying by property values

### When to Use Raw Firebase API

- ✅ Complex queries with multiple conditions
- ✅ Single-node transactions with `ref.transaction()`
- ✅ Real-time listeners and subscriptions
- ✅ Multi-path atomic updates
- ✅ Working with non-entity data (counters, flags, etc.)

### Example Comparison

**EntityService approach:**
```typescript
const userService = new EntityService<User>(db.database, handler.cfg.buildPath('users'));
const admins = await userService.findAllBy('role', 'admin');
```

**Raw Firebase API approach:**
```typescript
const snapshot = await db.database
  .ref(handler.cfg.buildPath('users'))
  .orderByChild('role')
  .equalTo('admin')
  .once('value');

const admins = snapshot.val();
```

{: .tip }
> Both approaches work! EntityService provides type safety and cleaner code, while raw Firebase API offers more flexibility for complex operations.

---

## API Reference

For complete API documentation, see:
- **[EntityService API](../api/services#entityservice)** - Full method reference
- **[IEntity Interface](../api/interfaces#ientity)** - Entity interface definition
- **[FirebaseDataService](../api/services#firebasedataservice)** - Low-level operations

---

## See Also

- **[Migration Scripts](migration-scripts)** - General migration patterns
- **[Transactions](transactions)** - Understanding Firebase transaction limitations
- **[Best Practices](best-practices)** - Firebase-specific patterns and tips
- **[Testing](testing)** - Testing migrations with EntityService
