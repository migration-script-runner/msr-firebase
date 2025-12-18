---
layout: default
title: Firebase-Specific Features
parent: Guides
nav_order: 2
---

# Firebase-Specific Features
{: .no_toc }

Firebase Realtime Database-specific patterns and features for migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Server Timestamps

Use Firebase server timestamps for consistent timing:

```typescript
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('posts/post1').set({
    title: 'Hello World',
    createdAt: admin.database.ServerValue.TIMESTAMP
  });
};
```

## Transactions

Use transactions for atomic operations:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const counterRef = db.ref('counters/posts');

  await counterRef.transaction((current) => {
    return (current || 0) + 1;
  });
};
```

## Multi-Path Updates

Update multiple paths atomically:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const updates: Record<string, any> = {};

  updates['users/user1/name'] = 'John Doe';
  updates['usernames/johndoe'] = 'user1';
  updates['meta/lastUpdate'] = admin.database.ServerValue.TIMESTAMP;

  await db.ref().update(updates);
};
```

## Priority

Set priorities for ordering:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('items/item1').setWithPriority({
    name: 'Item 1'
  }, 1);

  await db.ref('items/item2').setWithPriority({
    name: 'Item 2'
  }, 2);
};
```

## Queries

Work with ordered data:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  // Get last 10 items by timestamp
  const snapshot = await db.ref('items')
    .orderByChild('timestamp')
    .limitToLast(10)
    .once('value');

  // Process results
  const items: any[] = [];
  snapshot.forEach((child) => {
    items.push({ id: child.key, ...child.val() });
  });

  // Migrate items...
};
```

## Security Rules Considerations

{: .warning }
> Migrations run with admin privileges, but remember to update security rules for client access.

```typescript
// Migration creates new structure
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('publicData').set({
    config: { theme: 'light' }
  });
};

// Don't forget to update rules.json:
// {
//   "rules": {
//     "publicData": {
//       ".read": true,
//       ".write": false
//     }
//   }
// }
```

## Working with JSON Data

Import/export JSON structures:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const data = {
    users: {
      user1: { name: 'John' },
      user2: { name: 'Jane' }
    },
    posts: {
      post1: { title: 'First Post', author: 'user1' }
    }
  };

  await db.ref().set(data);
};
```

## Handling Large Datasets

Process large datasets in batches:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const BATCH_SIZE = 100;
  let lastKey: string | null = null;

  while (true) {
    let query = db.ref('users').orderByKey().limitToFirst(BATCH_SIZE);

    if (lastKey) {
      query = query.startAt(lastKey);
    }

    const snapshot = await query.once('value');

    if (!snapshot.hasChildren()) {
      break;
    }

    const updates: Record<string, any> = {};
    let count = 0;

    snapshot.forEach((child) => {
      if (child.key !== lastKey) {
        updates[`users/${child.key}/processed`] = true;
        lastKey = child.key;
        count++;
      }
    });

    if (count > 0) {
      await db.ref().update(updates);
    }

    if (count < BATCH_SIZE - 1) {
      break;
    }
  }
};
```

## Data Validation

Validate data structure before migration:

```typescript
export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  const snapshot = await db.ref('users').once('value');
  const users = snapshot.val();

  // Validate each user
  Object.entries(users || {}).forEach(([key, user]: [string, any]) => {
    if (!user.email || !user.name) {
      throw new Error(`Invalid user data for ${key}`);
    }
  });

  // Proceed with migration...
};
```

## Firebase Emulator

Test migrations with Firebase emulator:

```bash
# Start emulator
firebase emulators:start --only database

# Run migrations against emulator
export FIREBASE_DATABASE_URL=http://localhost:9000
npx msr-firebase migrate
```

## Performance Tips

### 1. Use Multi-Path Updates

Instead of:
```typescript
await db.ref('users/user1/name').set('John');
await db.ref('users/user1/email').set('john@example.com');
```

Use:
```typescript
await db.ref().update({
  'users/user1/name': 'John',
  'users/user1/email': 'john@example.com'
});
```

### 2. Batch Read Operations

Read related data in one query:
```typescript
const snapshot = await db.ref('users').once('value');
// Process all users from one snapshot
```

### 3. Avoid Deep Queries

Design data structures to minimize deep queries:
```typescript
// Good: Flat structure
{
  "users": { "user1": {...} },
  "posts": { "post1": {...} }
}

// Avoid: Deeply nested
{
  "users": {
    "user1": {
      "posts": {
        "post1": {...}
      }
    }
  }
}
```

## See Also

- [Writing Migrations](writing-migrations) - General migration patterns
- [Testing](testing) - Testing with Firebase emulator
- [Firebase Documentation](https://firebase.google.com/docs/database)
