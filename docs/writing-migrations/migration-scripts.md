---
layout: default
title: Migration Scripts
parent: Writing Migrations
nav_order: 1
---

# Writing Migration Scripts
{: .no_toc }

Best practices and patterns for writing Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Migration File Structure

### File Naming Convention

Migration files must follow this naming pattern:

```
V<timestamp>_<description>.ts
```

Examples:
- `V202501010001_create_users.ts`
- `V202501010002_add_email_index.ts`
- `V202501010003_migrate_user_profiles.ts`

{: .tip }
> Use `Date.now()` in JavaScript/TypeScript to generate timestamps, or create them manually in format `YYYYMMDDHHmm`.

### Class-Based Migration Template

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler } from '@migration-script-runner/firebase';

export default class YourMigration implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    // Your migration code here
    return 'Migration completed successfully';
  }

  async down(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    // Your rollback code here
    return 'Migration rolled back successfully';
  }
}
```

## Writing the `up()` Function

The `up()` function applies your migration changes.

### Creating Data

```typescript
export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    await db.database.ref(handler.cfg.buildPath('users')).set({
      user1: {
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: Date.now()
      }
    });
    return 'Created users node';
  }
}
```

### Updating Existing Data

```typescript
export default class AddVerifiedField implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));
    const snapshot = await usersRef.once('value');

    const updates: Record<string, any> = {};
    snapshot.forEach((child) => {
      updates[`${child.key}/verified`] = false;
    });

    await usersRef.update(updates);
    return `Added verified field to ${snapshot.numChildren()} users`;
  }
}
```

### Data Migration

```typescript
export default class MigrateUserData implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    // Read from old structure
    const oldRef = db.database.ref(handler.cfg.buildPath('oldPath'));
    const oldData = await oldRef.once('value');

    // Transform data
    const newData: Record<string, any> = {};
    oldData.forEach((child) => {
      const value = child.val();
      newData[child.key!] = {
        ...value,
        migratedAt: Date.now()
      };
    });

    // Write to new structure
    await db.database.ref(handler.cfg.buildPath('newPath')).set(newData);

    // Optionally remove old data
    await oldRef.remove();

    return `Migrated ${Object.keys(newData).length} records`;
  }
}
```

## Writing the `down()` Function

The `down()` function reverts your migration (optional but recommended).

```typescript
export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
  async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    // Reverse the changes made in up()
    await db.database.ref(handler.cfg.buildPath('users')).remove();
    return 'Removed users node';
  }
}
```

{: .important }
> If you don't provide a `down()` function, use backup-based rollback by configuring `backupMode: 'full'`.

## Best Practices

### 1. Idempotency

Make migrations idempotent (safe to run multiple times):

```typescript
export default class SetFeatureFlag implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const ref = db.database.ref(handler.cfg.buildPath('config/feature_flag'));
    const snapshot = await ref.once('value');

    // Only set if not already set
    if (!snapshot.exists()) {
      await ref.set(true);
      return 'Feature flag enabled';
    }

    return 'Feature flag already enabled';
  }
}
```

### 2. Batch Operations

Use multi-path updates for better performance:

```typescript
export default class UpdateMultiplePaths implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const updates: Record<string, any> = {};
    updates[handler.cfg.buildPath('users/user1/status')] = 'active';
    updates[handler.cfg.buildPath('users/user2/status')] = 'active';
    updates[handler.cfg.buildPath('meta/lastUpdated')] = Date.now();

    await db.database.ref().update(updates);
    return 'Updated multiple paths atomically';
  }
}
```

### 3. Error Handling

Always handle errors appropriately:

```typescript
export default class SafeMigration implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    try {
      const snapshot = await db.database.ref(handler.cfg.buildPath('users')).once('value');

      if (!snapshot.exists()) {
        throw new Error('Users node does not exist');
      }

      // Migration logic...
      return 'Migration completed';
    } catch (error) {
      console.error('Migration failed:', error);
      throw error; // Re-throw to mark migration as failed
    }
  }
}
```

### 4. Validate Data Before Migration

```typescript
export default class ValidatedMigration implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const snapshot = await db.database.ref(handler.cfg.buildPath('users')).once('value');
    const users = snapshot.val();

    // Validate structure
    if (!users || typeof users !== 'object') {
      throw new Error('Invalid users structure');
    }

    // Proceed with migration...
    return 'Migration completed';
  }
}
```

## Common Patterns

### Adding a New Field to All Records

```typescript
export default class AddEmailField implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const snapshot = await db.database.ref(handler.cfg.buildPath('users')).once('value');
    const updates: Record<string, any> = {};

    snapshot.forEach((child) => {
      updates[`users/${child.key}/email`] = '';
    });

    await db.database.ref(handler.cfg.buildPath('')).update(updates);
    return `Added email field to ${snapshot.numChildren()} users`;
  }
}
```

### Restructuring Data

```typescript
export default class RestructureUsers implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const oldSnapshot = await db.database.ref(handler.cfg.buildPath('users')).once('value');
    const newStructure: Record<string, any> = {};

    oldSnapshot.forEach((child) => {
      const user = child.val();
      newStructure[child.key!] = {
        profile: {
          name: user.name,
          email: user.email
        },
        settings: {
          notifications: user.notifications || true
        }
      };
    });

    await db.database.ref(handler.cfg.buildPath('users')).set(newStructure);
    return 'Restructured user data';
  }
}
```

### Creating Indexes

```typescript
export default class CreateEmailIndex implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const usersSnapshot = await db.database.ref(handler.cfg.buildPath('users')).once('value');
    const emailIndex: Record<string, string> = {};

    usersSnapshot.forEach((child) => {
      const user = child.val();
      if (user.email) {
        // Firebase keys cannot contain '.'
        const safeEmail = user.email.replace(/\./g, ',');
        emailIndex[safeEmail] = child.key!;
      }
    });

    await db.database.ref(handler.cfg.buildPath('indexes/email')).set(emailIndex);
    return `Created email index with ${Object.keys(emailIndex).length} entries`;
  }
}
```

## Testing Migrations

Always test migrations before production:

1. Test with Firebase emulator
2. Test with a copy of production data
3. Verify rollback works correctly

See [Testing Guide](testing) for detailed instructions.

---

## See Also

- **[Transactions](transactions)** - Understanding Firebase transaction limitations
- **[Testing](testing)** - Testing migrations with Firebase Emulator
- **[Best Practices](best-practices)** - Firebase-specific patterns and tips
