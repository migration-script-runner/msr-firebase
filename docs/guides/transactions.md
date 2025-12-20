---
layout: default
title: Transactions
parent: Guides
nav_order: 6
---

# Firebase Transactions
{: .no_toc }

Understanding transaction support and limitations in MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Important: Transaction Limitations

{: .warning }
**Firebase Realtime Database does NOT support database-wide transactions.** Unlike SQL databases (PostgreSQL, MySQL) or document databases (MongoDB, Firestore), Firebase RTDB only supports **single-node atomic operations** via `ref.transaction()`.

### Why No Database-Wide Transactions?

This is a **Firebase platform limitation**, not an MSR Firebase limitation. Firebase Realtime Database's architecture does not provide:

- ❌ Multi-document transactions
- ❌ Cross-path atomic operations
- ❌ Rollback across multiple nodes
- ❌ ACID guarantees across the database

See [Firebase's Transaction Documentation](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions) for details.

### Transaction Mode Configuration

MSR Firebase automatically sets `transaction.mode = TransactionMode.NONE` because Firebase doesn't support database-wide transactions. This means:

- Each migration executes **without** automatic transaction wrapping
- Failed migrations do **not** automatically rollback all changes
- Use MSR's [backup/restore feature](backup-restore) for rollback protection

```typescript
// AppConfig automatically configures this
this.transaction.mode = TransactionMode.NONE;
```

---

## Single-Node Atomic Operations

Firebase **does** support atomic operations on a **single node** using `ref.transaction()`. Use these for read-modify-write operations where you need atomicity.

### When to Use Single-Node Transactions

✅ **Good use cases:**
- Incrementing counters
- Toggle flags
- Updating a single record atomically
- Conditional updates based on current value

❌ **Cannot be used for:**
- Updating multiple unrelated paths
- Cross-collection operations
- Multi-step migrations requiring full rollback

### Example: Atomic Counter Increment

```typescript
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler } from '@migration-script-runner/firebase';

export default class IncrementPostCounter implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const counterRef = db.database.ref(handler.cfg.buildPath('counters/posts'));

    // Atomic read-modify-write operation
    const result = await counterRef.transaction((current) => {
      return (current || 0) + 1;
    });

    if (!result.committed) {
      throw new Error('Transaction aborted');
    }

    return `Post counter incremented to ${result.snapshot.val()}`;
  }

  async down(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const counterRef = db.database.ref(handler.cfg.buildPath('counters/posts'));

    await counterRef.transaction((current) => {
      return Math.max(0, (current || 0) - 1);
    });

    return 'Post counter decremented';
  }
}
```

### Example: Conditional Update

```typescript
export default class ToggleFeatureFlag implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const flagRef = db.database.ref(handler.cfg.buildPath('features/newUI'));

    await flagRef.transaction((current) => {
      // Only enable if not already set
      if (current === null || current === undefined) {
        return { enabled: true, enabledAt: Date.now() };
      }
      return current; // Keep existing value
    });

    return 'Feature flag toggled';
  }
}
```

---

## Migration Safety Without Transactions

Since Firebase doesn't support database-wide transactions, use these strategies for safe migrations:

### 1. Use Backups (Recommended)

Always create backups before migrations:

```bash
# Manual backup before migration
npx msr-firebase backup

# Run migration
npx msr-firebase migrate

# Restore if something goes wrong
npx msr-firebase restore backup-2025-01-15-10-30-00.bkp
```

MSR Firebase automatically creates backups when running migrations programmatically:

```typescript
const runner = await FirebaseRunner.getInstance({ config: appConfig });

// Automatic backup before migrate
const result = await runner.migrate();

// If migration fails, restore from backup
if (!result.success) {
  await runner.restoreFromLastBackup();
}
```

### 2. Idempotent Migrations

Write migrations that can be safely re-run:

```typescript
export default class CreateUsersNode implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));

    // Check if already exists
    const snapshot = await usersRef.once('value');
    if (snapshot.exists()) {
      return 'Users node already exists, skipping';
    }

    // Safe to create
    await usersRef.set({});
    return 'Created users node';
  }
}
```

### 3. Small, Focused Migrations

Break large changes into smaller migrations:

```typescript
// ✅ Good: Small, focused migration
export default class AddUserEmailField implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));
    const snapshot = await usersRef.once('value');
    const users = snapshot.val() || {};

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.email) {
        await usersRef.child(`${userId}/email`).set('');
      }
    }
    return 'Added email field to users';
  }
}

// ❌ Bad: Too many operations in one migration
// If something fails halfway, hard to recover
```

### 4. Validation Before Writing

Validate data before making changes:

```typescript
export default class MigrateUserRoles implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();

    // Validate first
    if (!users || typeof users !== 'object') {
      throw new Error('Invalid users data structure');
    }

    const userCount = Object.keys(users).length;
    if (userCount === 0) {
      return 'No users to migrate';
    }

    // Proceed with migration
    for (const [userId, userData] of Object.entries(users)) {
      const role = userData.isAdmin ? 'admin' : 'user';
      await usersRef.child(`${userId}/role`).set(role);
    }

    return `Migrated ${userCount} user roles`;
  }
}
```

---

## Common Patterns

### Pattern: Batch Updates with Validation

```typescript
export default class UpdateAllPosts implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const postsRef = db.database.ref(handler.cfg.buildPath('posts'));
    const snapshot = await postsRef.once('value');
    const posts = snapshot.val() || {};

    const updates: Record<string, unknown> = {};

    // Build update object
    for (const [postId, postData] of Object.entries(posts)) {
      updates[`${postId}/updatedAt`] = Date.now();
      updates[`${postId}/version`] = 2;
    }

    // Single atomic update for all changes
    await postsRef.update(updates);

    return `Updated ${Object.keys(posts).length} posts`;
  }
}
```

### Pattern: Checkpoint Progress

For large migrations, save progress:

```typescript
export default class MigrateLargeDataset implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const dataRef = db.database.ref(handler.cfg.buildPath('large_dataset'));
    const progressRef = db.database.ref(handler.cfg.buildPath('_migration_progress/large_dataset'));

    // Check previous progress
    const progressSnap = await progressRef.once('value');
    const lastProcessed = progressSnap.val() || 0;

    const snapshot = await dataRef.once('value');
    const items = snapshot.val() || {};
    const itemIds = Object.keys(items);

    let processed = 0;
    for (const itemId of itemIds.slice(lastProcessed)) {
      // Process item
      await dataRef.child(`${itemId}/migrated`).set(true);

      processed++;

      // Save progress every 100 items
      if (processed % 100 === 0) {
        await progressRef.set(lastProcessed + processed);
      }
    }

    // Clear progress marker
    await progressRef.remove();

    return `Migrated ${processed} items`;
  }
}
```

---

## Comparison with Other Databases

| Feature | Firebase RTDB | SQL (Postgres/MySQL) | MongoDB | Firestore |
|---------|---------------|---------------------|---------|-----------|
| Database-wide transactions | ❌ | ✅ | ✅ | ✅ |
| Multi-document transactions | ❌ | ✅ | ✅ | ✅ |
| Single-node atomic ops | ✅ | ✅ | ✅ | ✅ |
| Automatic rollback | ❌ | ✅ | ✅ | ✅ |
| MSR Transaction Mode | `NONE` | `PER_MIGRATION` | `PER_MIGRATION` | `PER_MIGRATION` |

---

## Related Documentation

- [Firebase Transactions (Official)](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions)
- [MSR Firebase Backup & Restore](backup-restore)
- [Writing Safe Migrations](writing-migrations)
- [Configuration Guide](configuration)
