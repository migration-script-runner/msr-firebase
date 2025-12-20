---
layout: default
title: Writing Migrations
parent: Guides
nav_order: 1
---

# Writing Migrations
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
<timestamp>-<description>.ts
```

Examples:
- `1234567890-create-users.ts`
- `1234567891-add-email-index.ts`
- `1234567892-migrate-user-profiles.ts`

{: .tip }
> Use `Date.now()` in JavaScript/TypeScript to generate timestamps.

### Basic Migration Template

```typescript
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  // Your migration code here
};

export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  // Your rollback code here (optional)
};
```

## Writing the `up()` Function

The `up()` function applies your migration changes.

### Creating Data

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({
    user1: {
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: admin.database.ServerValue.TIMESTAMP
    }
  });
};
```

### Updating Existing Data

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');

  const updates: Record<string, any> = {};
  snapshot.forEach((child) => {
    updates[`${child.key}/verified`] = false;
  });

  await usersRef.update(updates);
};
```

### Data Migration

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  // Read from old structure
  const oldData = await db.ref('oldPath').once('value');

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
  await db.ref('newPath').set(newData);

  // Optionally remove old data
  await db.ref('oldPath').remove();
};
```

## Writing the `down()` Function

The `down()` function reverts your migration (optional but recommended).

```typescript
export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  // Reverse the changes made in up()
  await db.ref('users').remove();
};
```

{: .important }
> If you don't provide a `down()` function, you must configure a backup-based rollback strategy.

## Best Practices

### 1. Idempotency

Make migrations idempotent (safe to run multiple times):

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const ref = db.ref('config/feature_flag');
  const snapshot = await ref.once('value');

  // Only set if not already set
  if (!snapshot.exists()) {
    await ref.set(true);
  }
};
```

### 2. Batch Operations

Use multi-path updates for better performance:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const updates: Record<string, any> = {};
  updates['users/user1/status'] = 'active';
  updates['users/user2/status'] = 'active';
  updates['meta/lastUpdated'] = admin.database.ServerValue.TIMESTAMP;

  await db.ref().update(updates);
};
```

### 3. Error Handling

Always handle errors appropriately:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  try {
    const snapshot = await db.ref('users').once('value');

    if (!snapshot.exists()) {
      throw new Error('Users node does not exist');
    }

    // Migration logic...
  } catch (error) {
    console.error('Migration failed:', error);
    throw error; // Re-throw to mark migration as failed
  }
};
```

### 4. Use Single-Node Transactions for Counters

{: .info }
Firebase only supports atomic transactions on **single nodes**, not database-wide transactions. See the [Transactions Guide](transactions) for details.

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler } from '@migration-script-runner/firebase';

export default class IncrementUserCount implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const counterRef = db.database.ref(handler.cfg.buildPath('stats/userCount'));
    await counterRef.transaction((current) => {
      return (current || 0) + 1;
    });
    return 'Incremented user count';
  }
}
```

### 5. Validate Data Before Migration

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const snapshot = await db.ref('users').once('value');
  const users = snapshot.val();

  // Validate structure
  if (!users || typeof users !== 'object') {
    throw new Error('Invalid users structure');
  }

  // Proceed with migration...
};
```

## Common Patterns

### Adding a New Field to All Records

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const snapshot = await db.ref('users').once('value');
  const updates: Record<string, any> = {};

  snapshot.forEach((child) => {
    updates[`users/${child.key}/newField`] = 'defaultValue';
  });

  await db.ref().update(updates);
};
```

### Restructuring Data

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const oldSnapshot = await db.ref('users').once('value');
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

  await db.ref('users').set(newStructure);
};
```

### Creating Indexes

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const usersSnapshot = await db.ref('users').once('value');
  const emailIndex: Record<string, string> = {};

  usersSnapshot.forEach((child) => {
    const user = child.val();
    if (user.email) {
      emailIndex[user.email.replace('.', ',')] = child.key!;
    }
  });

  await db.ref('indexes/email').set(emailIndex);
};
```

## Testing Migrations

Always test migrations before production:

1. Test with Firebase emulator
2. Test with a copy of production data
3. Verify rollback works correctly

See [Testing Guide](testing) for detailed instructions.

## See Also

- [Firebase-Specific Features](firebase-specific) - Firebase-specific patterns
- [CLI Usage](cli-usage) - Running migrations with CLI
- [Testing](testing) - Testing your migrations
