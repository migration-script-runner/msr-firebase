---
layout: default
title: Writing Migrations
nav_order: 6
has_children: true
---

# Writing Migrations
{: .no_toc }

Complete guide to writing and managing Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Overview

This section covers everything you need to know about writing, testing, and managing migration scripts for Firebase Realtime Database using MSR Firebase.

## Guides

### [Migration Scripts](migration-scripts)
Learn the fundamentals of writing migration scripts, including file naming conventions, up/down functions, common patterns, and best practices for idempotent migrations.

### [Transactions](transactions)
Understand Firebase's single-node transaction limitations and learn safe migration patterns for databases without database-wide transactions.

### [Backup & Restore](backup-restore)
Master backup strategies and restore operations to protect your data during migrations, including automatic backups, rollback patterns, and disaster recovery.

### [Testing](testing)
Learn how to test migrations using Firebase Emulator, write unit and integration tests, and set up automated testing in CI/CD pipelines.

### [Migration Locking](migration-locking)
Prevent concurrent migrations in distributed environments like Kubernetes, Docker Swarm, and multi-region deployments with distributed locking.

### [Best Practices](best-practices)
Firebase-specific patterns, performance tips, and advanced techniques for working with Firebase Realtime Database migrations.

---

## Quick Start

### Basic Migration Template

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
    // Rollback code here
    return 'Migration rolled back successfully';
  }
}
```

---

## Key Concepts

### Migration Lifecycle

1. **Write** - Create migration script with up() and down() functions
2. **Validate** - Run validation to check for errors
3. **Test** - Test against Firebase Emulator
4. **Apply** - Run migration against database
5. **Verify** - Confirm changes are correct
6. **Rollback** - Revert if needed using down() or backup restore

### Firebase Limitations

{: .warning }
**Important:** Firebase Realtime Database does NOT support database-wide transactions. Only single-node atomic operations via `ref.transaction()` are supported. See [Transactions](transactions) for safe migration patterns.

### Safety Measures

- **Backups** - Automatic backup before each migration run
- **Validation** - Validate migration scripts before applying
- **Locking** - Prevent concurrent migrations in distributed environments
- **Idempotency** - Write migrations that can be safely re-run
- **Testing** - Test migrations with Firebase Emulator before production

---

## Common Patterns

### Creating Data

```typescript
async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
  await db.database.ref(handler.cfg.buildPath('users')).set({
    user1: { name: 'Alice', email: 'alice@example.com' }
  });
  return 'Created users node';
}
```

### Updating Data

```typescript
async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
  const usersRef = db.database.ref(handler.cfg.buildPath('users'));
  const snapshot = await usersRef.once('value');

  const updates: Record<string, any> = {};
  snapshot.forEach((child) => {
    updates[`${child.key}/verified`] = false;
  });

  await usersRef.update(updates);
  return 'Added verified field to all users';
}
```

### Restructuring Data

```typescript
async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
  const oldRef = db.database.ref(handler.cfg.buildPath('oldPath'));
  const newRef = db.database.ref(handler.cfg.buildPath('newPath'));

  const snapshot = await oldRef.once('value');
  const data = snapshot.val();

  // Transform and move data
  await newRef.set(data);
  await oldRef.remove();

  return 'Restructured data from oldPath to newPath';
}
```

---

## Next Steps

1. **Learn the Basics** - Start with [Migration Scripts](migration-scripts) to understand file structure and patterns
2. **Understand Limitations** - Read [Transactions](transactions) to learn about Firebase's transaction limitations
3. **Set Up Testing** - Follow [Testing](testing) to test migrations with Firebase Emulator
4. **Deploy Safely** - Review [Best Practices](best-practices) for production deployments

---

## Additional Resources

- **[CLI Usage](../cli-usage/)** - Run migrations from command line
- **[Library Usage](../library-usage/)** - Programmatic migration execution
- **[API Reference](../api/)** - Complete API documentation
- **[MSR Core Documentation](https://migration-script-runner.github.io/msr-core)** - Core migration concepts
