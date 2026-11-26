---
layout: default
title: Migration Locking
parent: Writing Migrations
nav_order: 6
---

# Migration Locking
{: .no_toc }

Prevent concurrent migrations in distributed environments
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

Migration locking prevents multiple instances of your application from running migrations simultaneously. This is critical in distributed environments where multiple containers, pods, or servers might attempt to run migrations at the same time.

### Why Locking Matters

Without locking, concurrent migrations can cause:
- **Data corruption**: Multiple processes modifying the same data simultaneously
- **Race conditions**: Migrations executing out of order
- **Duplicate executions**: Same migration running multiple times
- **Schema conflicts**: Incompatible schema changes being applied concurrently

### When to Use Locking

Enable migration locking when deploying in:
- **Kubernetes**: Multiple pods starting simultaneously
- **Docker Swarm**: Multiple replicas of the same service
- **Auto-scaling environments**: Dynamic instance creation
- **CI/CD pipelines**: Parallel deployment workflows
- **Multi-region deployments**: Services running in different regions

## How Locking Works

The FirebaseLockingService implements a distributed lock using Firebase Realtime Database transactions:

### Two-Phase Locking

1. **Acquire Lock**: Attempt to set lock using atomic transaction
2. **Verify Ownership**: Confirm lock is still owned before executing migrations

### Lock Storage

Locks are stored at `{shift}/migrations/_lock` with the following data:
```json
{
  "runnerId": "hostname-pid-uuid",
  "lockedAt": 1705324800000,
  "expiresAt": 1705325400000,
  "hostname": "web-server-1",
  "processId": 12345
}
```

The lock record now stores `runnerId`. Active records created by earlier adapter versions continue to block other runners until they expire, although their owner ID may be unknown to the new version. Wait for the configured lock timeout before rollout or let the lock expire before starting migrations with the new version.

### Automatic Expiration

Locks automatically expire after the configured timeout (default: 10 minutes). Expired locks are cleaned up atomically during the next lock acquisition attempt.

## Configuration

### Basic Configuration

MSR Core enables locking by default. Configure the timeout if needed; set `enabled: false` only when you deliberately want migrations to run without the lock.

```javascript
// msr.config.js
module.exports = {
  folder: './migrations',
  tableName: 'schema_version',

  locking: {
    timeout: 600000  // 10 minutes in milliseconds
  }
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable migration locking |
| `timeout` | number | `600000` | Lock timeout in milliseconds (10 minutes) |

### Environment-Specific Configuration

Enable locking only in production:

```javascript
// msr.config.js
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  folder: './migrations',
  tableName: 'schema_version',

  locking: {
    enabled: isProduction,
    timeout: 600000
  }
};
```

## Lock Management

### Check Lock Status

Check if a migration lock is currently held:

```bash
msr-firebase lock:status
```

**Example output (locked):**
```
🔒 Lock Status: LOCKED

   Runner ID:  web-server-1-12345-a1b2c3d4
   Acquired At:  2024-01-15T10:30:00.000Z
   Expires At:   2024-01-15T10:40:00.000Z
   Process ID:   12345
```

**Example output (unlocked):**
```
🔓 Lock Status: UNLOCKED

   No active migration lock
```

### Force Release Stuck Lock

If a lock becomes stuck (e.g., process crashed), you can force-release it:

```bash
msr-firebase lock:release --force
```

**Output:**
```
⚠️  Warning: Force-releasing migration lock

   Locked by:    web-server-1-12345-a1b2c3d4
   Acquired at:  2024-01-15T10:30:00.000Z

✅ Lock released successfully
```

{: .warning }
> **DANGER**: Only use `lock:release --force` when you are absolutely certain no migration is running. Releasing an active lock can cause data corruption.

### When to Force Release

Force-release a lock only when:
- ✅ The process holding the lock has crashed
- ✅ The lock has been held beyond reasonable time
- ✅ You've verified no migrations are running (check logs, process list)
- ❌ **NEVER** force-release during an active migration

## Troubleshooting

### Lock Already Held Error

**Error message:**
```
Migration lock is currently held by another process.
Runner: web-server-2-67890-e5f6g7h8
Locked since: 2024-01-15T10:30:00.000Z
Expires at: 2024-01-15T10:40:00.000Z

If you believe this is a stale lock, use: msr-firebase lock:release --force
```

**Solution:**
1. Wait for the lock to expire (check `Expires at` time)
2. Verify the process holding the lock has crashed
3. If confirmed, use `lock:release --force`

### Lock Timeout Too Short

**Symptoms:**
- Migrations fail frequently with "lock already held" errors
- Migrations timing out before completion

**Solution:**
Increase the lock timeout:

```javascript
// msr.config.js
module.exports = {
  locking: {
    enabled: true,
    timeout: 1800000  // 30 minutes
  }
};
```

### Lock Path Not Accessible

**Error message:**
```
Failed to initialize lock storage at migrations/_lock: PERMISSION_DENIED
```

**Solution:**
MSR Firebase uses the Firebase Admin SDK. With administrative credentials, it bypasses Realtime Database Security Rules, so changing those rules will not fix this error. Check that the configured database URL points to the intended instance, the service account has the required Firebase/Google Cloud access, the credentials are valid, and the process can reach Firebase. If you deliberately initialized the Admin SDK with limited privileges, check that service's `databaseAuthVariableOverride` and the matching rules. See the [Firebase Admin SDK access levels](https://firebase.google.com/docs/database/admin/start#authenticate_with_limited_privileges).

## Best Practices

### 1. Keep Locking Enabled in Production

```javascript
// msr.config.js
module.exports = {
  locking: {
    enabled: process.env.NODE_ENV === 'production',
    timeout: 600000
  }
};
```

### 2. Set Appropriate Timeout

Choose a timeout based on your migration complexity:
- **Simple migrations**: 5 minutes (300000 ms)
- **Standard migrations**: 10 minutes (600000 ms)
- **Complex migrations**: 30 minutes (1800000 ms)

### 3. Monitor Lock Status

Use the runner's public `getLockStatus()` method for application diagnostics. The CLI also provides `lock:status` for operational checks; see [Commands](../cli-usage/commands#lockstatus).

```typescript
const status = await runner.getLockStatus();
if (status?.isLocked) {
  console.log(`Migration lock held by ${status.lockedBy}`);
}
```

### 4. Handle Lock Failures Gracefully

```typescript
async function runMigrations(): Promise<void> {
  try {
    await runner.migrate();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('lock')) {
      console.log('Migrations skipped - lock held by another process');
      return;
    }
    throw error;
  }
}
```

## Deployment Examples

Run one migration job per release before starting or updating application replicas. Do not run `msr-firebase migrate` in every pod's startup command: locking prevents overlap, but competing runners fail fast by default rather than waiting.

### Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: my-app-migrations
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrations
          image: my-app:latest
          command: ["msr-firebase", "migrate"]
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: firebase-secrets
                  key: database-url
            - name: GOOGLE_APPLICATION_CREDENTIALS
              value: /secrets/firebase-key.json
          volumeMounts:
            - name: firebase-credentials
              mountPath: /secrets
              readOnly: true
      volumes:
        - name: firebase-credentials
          secret:
            secretName: firebase-service-account
            items:
              - key: service-account.json
                path: firebase-key.json
```

Wait for the Job to complete successfully before rolling out application replicas.

### Docker Compose

Run a one-shot migration service before starting or updating the application:

```yaml
services:
  migrations:
    image: my-app:latest
    command: ["msr-firebase", "migrate"]
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      GOOGLE_APPLICATION_CREDENTIALS: /secrets/firebase-key.json
    volumes:
      - ./firebase-key.json:/secrets/firebase-key.json:ro

  app:
    image: my-app:latest
    command: ["npm", "start"]
```

Run `docker compose run --rm migrations` and wait for it to succeed before `docker compose up -d app`.

### CI/CD Pipeline

Provide `DATABASE_URL` and `GOOGLE_APPLICATION_CREDENTIALS` to the job, and write the service-account secret to the referenced file before running the command. For a complete credentials setup, see [CI/CD Integration](../cli-usage/ci-cd).

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Run Migrations
        run: msr-firebase migrate
        env:
          NODE_ENV: production
```

With the default zero retries, at most one region's job acquires the lock; competing jobs fail fast with a lock error. Prefer a single migration job in the deployment pipeline. Configure Core's retry options only if concurrent jobs are intentional and should wait for the lock.

## Advanced Usage

The examples in this section use `runner.getHandler().lockingProvider`, a low-level adapter contract. Prefer Core-managed locking and the public `runner.getLockStatus()` method for routine use. Directly acquiring or force-releasing locks can interfere with Core's migration lifecycle; use these methods only when implementing a deliberate custom coordination flow.

### Custom Runner ID

Generate custom runner IDs for better tracking:

```javascript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';

const appConfig = new FirebaseConfig();
appConfig.databaseUrl = process.env.DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const lockingProvider = runner.getHandler().lockingProvider;

if (lockingProvider) {
  const runnerId = `${hostname()}-${process.pid}-${randomUUID()}`;
  const lockAcquired = await lockingProvider.acquireLock(runnerId);
  if (lockAcquired) {
    try {
      // Perform a separate operation protected by this lock.
    } finally {
      await lockingProvider.releaseLock(runnerId);
    }
  }
}
```

### Lock Status Monitoring

Build a monitoring dashboard:

```javascript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function monitorLock() {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });
  const handler = runner.getHandler();

  if (!handler.lockingProvider) {
    console.log('Locking not enabled');
    return;
  }

  const status = await handler.lockingProvider.getLockStatus();

  if (status && status.isLocked) {
    console.log('Migration in progress:', {
      runner: status.lockedBy,
      started: status.lockedAt,
      expires: status.expiresAt,
      duration: Date.now() - status.lockedAt.getTime()
    });
  }
}

setInterval(monitorLock, 60000);  // Check every minute
```

### Programmatic Lock Management

```javascript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

// Check if locking is enabled
if (handler.lockingProvider) {
  // Get current lock status
  const status = await handler.lockingProvider.getLockStatus();

  // Force release if needed
  if (status && isStuckLock(status)) {
    await handler.lockingProvider.forceReleaseLock();
  }
}

function isStuckLock(status) {
  const ageMinutes = (Date.now() - status.lockedAt.getTime()) / 60000;
  return ageMinutes > 30;  // Stuck if older than 30 minutes
}
```

