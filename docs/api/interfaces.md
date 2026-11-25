---
layout: default
title: Interfaces
parent: API Reference
nav_order: 4
---

# Interfaces
{: .no_toc }

Firebase-specific interfaces used by migration scripts and entity helpers.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## IFirebaseDB

The database adapter contract passed to migration scripts. It extends MSR Core's `IDB` and exposes the Firebase Admin Realtime Database instance as `database`.

```typescript
import type { Database } from 'firebase-admin/database';
import type { IDB } from '@migration-script-runner/core';

export interface IFirebaseDB extends IDB {
  database: Database;
}
```

Use the Firebase reference API for reads and writes. Realtime Database transactions are atomic for a single node, not across the whole database. See [Transactions](../writing-migrations/transactions) for safe patterns.

## IEntity

Base shape used by [EntityService](services). The `key` property is optional: omit it when creating an entity; entities retrieved from Firebase include their key.

```typescript
export interface IEntity {
  key?: string;
}
```

New entities do not need a `key`:

```typescript
import { EntityService, type IEntity } from '@migration-script-runner/firebase';
import type { Database } from 'firebase-admin/database';

interface User extends IEntity {
  name: string;
}

async function addUser(database: Database): Promise<string> {
  const users = new EntityService<User>(database, 'users');
  return users.create({ name: 'Alice' });
}
```

MSR Core defines the migration-script contract and the remaining database interfaces. See the [MSR Core API documentation](https://core.migration-script-runner.dev/api/).
