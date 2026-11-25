---
layout: default
title: Types
parent: API Reference
nav_order: 5
---

# Types
{: .no_toc }

Firebase-specific types exported by MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## EntityService types

`EntityService` exports the `UpdateFunction<T>` callback type and `ModificationResults` result shape.

```typescript
export type UpdateFunction<T> = (entity: T) => boolean;

export type ModificationResults = {
  skipped: string[];
  updated: string[];
};
```

The callback passed to `updateAll()` mutates an entity and returns `true` when it should be saved. The result contains Firebase keys for updated and skipped entities.

```typescript
import { EntityService, type IEntity, type ModificationResults } from '@migration-script-runner/firebase';
import type { Database } from 'firebase-admin/database';

interface User extends IEntity {
  name: string;
}

async function updateUsers(database: Database): Promise<ModificationResults> {
  const users = new EntityService<User>(database, 'users');
  return users.updateAll((user) => {
    if (user.name !== 'Alice') return false;
    user.name = 'Alicia';
    return true;
  });
}
```

See the [EntityService API](services#entityservice) for all methods, and [Interfaces](interfaces) for `IFirebaseDB` and `IEntity`.
