---
layout: default
title: EntityService Examples
parent: Writing Migrations
nav_order: 9
---

# EntityService Migration Examples
{: .no_toc }

Complete migration examples using `EntityService` with Firebase Realtime Database.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

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

    const users: User[] = [
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
        ...mod,
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
      await userService.update(mod.key!, { ...mod, permissions: [] });
    });

    await Promise.all(updatePromises);

    return `Removed permissions from ${moderators.length} moderators`;
  }
}
```

---

## See Also

- **[Using EntityService](using-entityservice)** - Setup, CRUD operations, and best practices
- **[Migration Scripts](migration-scripts)** - Migration structure and lifecycle
- **[Testing](testing)** - Test migrations with Firebase Emulator
