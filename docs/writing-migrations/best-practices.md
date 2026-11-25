---
layout: default
title: Best Practices
parent: Writing Migrations
nav_order: 7
---

# Best Practices
{: .no_toc }

Practical patterns for safe, maintainable Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Use Firebase Server Timestamps

Server timestamps avoid relying on clocks from the machine running a migration.

```typescript
import { IMigrationInfo, IRunnableScript } from '@migration-script-runner/core';
import { FirebaseHandler, IFirebaseDB } from '@migration-script-runner/firebase';
import { ServerValue } from 'firebase-admin/database';

export default class AddCreatedAt implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('posts/post-1')).update({
      createdAt: ServerValue.TIMESTAMP
    });
    return 'Added server timestamp';
  }
}
```

## Use Single-Node Transactions for Read-Modify-Write

Firebase supports atomic transactions at one database path, not across unrelated paths. See [Transactions](transactions) for the platform limitation and examples.

```typescript
export default class IncrementCounter implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const counter = db.database.ref(handler.cfg.buildPath('counters/posts'));
    await counter.transaction((current) => (current ?? 0) + 1);
    return 'Incremented post counter';
  }
}
```

## Batch Independent Path Updates

Use one multi-path update when changes should be written together. Keep every key relative to the root reference and account for the configured `shift` when building paths.

```typescript
export default class UpdateStatuses implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const root = db.database.ref(handler.cfg.getRoot());
    const updates: Record<string, unknown> = {
      'users/user-1/status': 'active',
      'users/user-2/status': 'active',
      'meta/lastUpdated': Date.now()
    };
    await root.update(updates);
    return 'Updated user statuses';
  }
}
```

## Handle Data as Untrusted Input

A migration should tolerate missing or unexpected data. Narrow values before reading properties, and avoid assuming every child has a key or object value.

```typescript
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

export default class AddVerifiedFlag implements IRunnableScript<IFirebaseDB> {
  async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
    const users = db.database.ref(handler.cfg.buildPath('users'));
    const snapshot = await users.once('value');
    const updates: Record<string, unknown> = {};

    snapshot.forEach((child) => {
      if (child.key !== null) {
        updates[`${child.key}/verified`] = Boolean(asRecord(child.val()).verified);
      }
    });

    await users.update(updates);
    return `Updated ${snapshot.numChildren()} users`;
  }
}
```

## Process Large Datasets in Batches

Paginate rather than loading and rewriting a large database subtree at once. Use a stable ordering key and verify the boundary logic with representative data before production.

```typescript
const batchSize = 100;
let cursor: string | undefined;

while (true) {
  let query = db.database.ref(handler.cfg.buildPath('users'))
    .orderByKey()
    .limitToFirst(batchSize);
  if (cursor !== undefined) query = query.startAt(cursor);

  const snapshot = await query.once('value');
  if (!snapshot.hasChildren()) break;

  const updates: Record<string, unknown> = {};
  let lastKey: string | undefined;
  snapshot.forEach((child) => {
    if (child.key !== null && child.key !== cursor) {
      updates[`${child.key}/processed`] = true;
      lastKey = child.key;
    }
  });

  if (Object.keys(updates).length > 0) await snapshot.ref.update(updates);
  if (lastKey === undefined || snapshot.numChildren() < batchSize) break;
  cursor = lastKey;
}
```

## Plan Rollback Before Running

- Prefer idempotent `up()` implementations.
- Implement `down()` when reversing the change is reliable.
- Use a tested backup strategy for changes that cannot be safely reversed with `down()`.
- Test against the Firebase Emulator or an isolated non-production project first.
- Keep service-account credentials out of source control and logs.

See [Backup & Restore](backup-restore), [Testing](testing), and [Migration Scripts](migration-scripts) for the complete workflows.
