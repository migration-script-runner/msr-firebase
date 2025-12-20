---
layout: default
title: Migration Locking
parent: Guides
nav_order: 7
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
  "executorId": "hostname-pid-uuid",
  "lockedAt": 1705324800000,
  "expiresAt": 1705325400000,
  "hostname": "web-server-1",
  "processId": 12345
}
```

### Automatic Expiration

Locks automatically expire after the configured timeout (default: 10 minutes). Expired locks are cleaned up atomically during the next lock acquisition attempt.

## Configuration

### Basic Configuration

Enable locking by adding the `locking` configuration:

```javascript
// msr.config.js
module.exports = {
  folder: './migrations',
  tableName: 'schema_version',

  // Enable migration locking
  locking: {
    enabled: true,
    timeout: 600000  // 10 minutes in milliseconds
  }
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable migration locking |
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

   Executor ID:  web-server-1-12345-a1b2c3d4
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
Executor: web-server-2-67890-e5f6g7h8
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
Ensure your Firebase security rules allow read/write access to the lock path:

```json
{
  "rules": {
    "migrations": {
      "_lock": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Best Practices

### 1. Always Enable Locking in Production

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

Add lock status checks to your health checks:

```javascript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({ config: appConfig });
const handler = runner.getHandler();

if (handler.lockingService) {
  const lockStatus = await handler.lockingService.getLockStatus();
  console.log('Lock status:', lockStatus);
}
```

### 4. Log Lock Acquisition

Enable detailed logging to track lock acquisition:

```javascript
// In your migration runner
const lockAcquired = await lockingService.acquireLock(executorId);
if (lockAcquired) {
  console.log(`Lock acquired by ${executorId}`);
} else {
  console.log('Failed to acquire lock - another process is running migrations');
}
```

### 5. Handle Lock Failures Gracefully

```javascript
try {
  await runner.migrate();
} catch (error) {
  if (error.message.includes('lock')) {
    console.log('Migrations skipped - lock held by another process');
    process.exit(0);  // Exit gracefully
  }
  throw error;
}
```

## Deployment Examples

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  template:
    spec:
      initContainers:
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
```

With locking enabled, only one pod will successfully run migrations. Others will wait or skip gracefully.

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    image: my-app:latest
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    command: sh -c "msr-firebase migrate && npm start"
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [us-east, us-west, eu-west]
    steps:
      - name: Run Migrations
        run: msr-firebase migrate
        env:
          NODE_ENV: production
```

Locking ensures only one region's deployment runs migrations.

## Advanced Usage

### Custom Executor ID

Generate custom executor IDs for better tracking:

```javascript
import { hostname } from 'os';
import { v4 as uuidv4 } from 'uuid';

const executorId = `${hostname()}-${process.pid}-${uuidv4()}`;
const lockAcquired = await lockingService.acquireLock(executorId);
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

  if (!handler.lockingService) {
    console.log('Locking not enabled');
    return;
  }

  const status = await handler.lockingService.getLockStatus();

  if (status && status.isLocked) {
    console.log('Migration in progress:', {
      executor: status.lockedBy,
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
if (handler.lockingService) {
  // Get current lock status
  const status = await handler.lockingService.getLockStatus();

  // Force release if needed
  if (status && isStuckLock(status)) {
    await handler.lockingService.forceReleaseLock();
  }
}

function isStuckLock(status) {
  const ageMinutes = (Date.now() - status.lockedAt.getTime()) / 60000;
  return ageMinutes > 30;  // Stuck if older than 30 minutes
}
```

