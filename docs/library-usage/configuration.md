---
layout: default
title: Configuration
parent: Library Usage
nav_order: 2
---

# Library Configuration
{: .no_toc }

Configure MSR Firebase programmatically using the FirebaseConfig class.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

MSR Firebase is configured using the `FirebaseConfig` class, which extends MSR Core's `Config` class and adds Firebase-specific properties.

**Configuration sources:**
1. **Programmatic** - Direct property assignment
2. **Environment Variables** - Via `process.env`
3. **Config Files** - Load from JSON/JS files

---

## Firebase-Specific Properties

### databaseUrl

Firebase Realtime Database URL.

```typescript
config.databaseUrl = 'https://your-project.firebaseio.com';
```

**Type:** `string | undefined`

**Default:** `process.env.DATABASE_URL`

**Example:**
```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = 'https://my-project.firebaseio.com';
```

---

### applicationCredentials

Path to Firebase service account key JSON file.

```typescript
config.applicationCredentials = './serviceAccountKey.json';
```

**Type:** `string | undefined`

**Default:** `process.env.GOOGLE_APPLICATION_CREDENTIALS`

**Example:**
```typescript
config.applicationCredentials = './config/firebase-key.json';
```

---

### shift

Root path prefix for multi-environment database namespacing.

```typescript
config.shift = 'production';
```

**Type:** `string | undefined`

**Default:** `undefined` (root level)

**Use Case:** Store multiple environments in a single Firebase database

**Example:**
```typescript
// Different environments in same database
config.shift = 'production';  // Data at /production/*
config.shift = 'staging';     // Data at /staging/*
config.shift = 'development'; // Data at /development/*
```

**Helper Methods:**
```typescript
// Build path with shift prefix
const path = config.buildPath('users'); // Returns: 'production/users'

// Get root path
const root = config.getRoot(); // Returns: 'production/'
```

---

### tableName

Name of the migration tracking node in Firebase.

```typescript
config.tableName = 'schema_version';
```

**Type:** `string`

**Default:** `'schema_version'`

**Example:**
```typescript
config.tableName = 'migrations';
```

---

## Standard MSR Properties

MSR Firebase inherits configuration properties from MSR Core:

### folder

Path to migrations directory.

```typescript
config.folder = './migrations';
```

**Type:** `string`

**Default:** `'./migrations'`

**Example:**
```typescript
config.folder = './db/migrations';
```

---

### locking

Migration locking configuration for distributed environments.

```typescript
config.locking = {
  enabled: true,
  timeout: 600000  // 10 minutes
};
```

**Type:** `{ enabled: boolean; timeout: number }`

**Default:** `{ enabled: false, timeout: 600000 }`

**When to enable:**
- Kubernetes deployments with multiple pods
- Docker Swarm with multiple replicas
- Auto-scaling environments
- CI/CD pipelines with parallel deployments

**Example:**
```typescript
config.locking = {
  enabled: process.env.NODE_ENV === 'production',
  timeout: 600000  // 10 minutes
};
```

---

### backupMode

Control automatic backup behavior during migrations.

```typescript
config.backupMode = 'full';
```

**Type:** `'full' | 'create_only' | 'restore_only' | 'manual'`

**Default:** `'full'`

**Values:**
- **`full`** - Create backup, restore on error, delete on success (default)
- **`create_only`** - Create backup but don't restore automatically
- **`restore_only`** - Don't create backup, restore from existing on error
- **`manual`** - No automatic backup/restore

**Example:**
```typescript
// Production: full automatic backup
config.backupMode = 'full';

// Development: no automatic backups
config.backupMode = 'manual';

// Create backup but use down() for rollback
config.backupMode = 'create_only';
```

---

### logLevel

Logging verbosity level.

```typescript
config.logLevel = 'info';
```

**Type:** `'error' | 'warn' | 'info' | 'debug'`

**Default:** `'info'`

---

### displayLimit

Maximum number of migrations to display in CLI output.

```typescript
config.displayLimit = 100;
```

**Type:** `number`

**Default:** `100`

---

## Configuration Examples

### Minimal Configuration

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = 'https://my-project.firebaseio.com';
config.applicationCredentials = './key.json';
```

---

### Complete Configuration

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();

// Firebase connection
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Migration settings
config.folder = './migrations';
config.tableName = 'schema_version';
config.shift = process.env.NODE_ENV; // dev/staging/production

// Backup settings
config.backupMode = 'full';

// Locking (production only)
config.locking = {
  enabled: process.env.NODE_ENV === 'production',
  timeout: 600000
};

// Display settings
config.displayLimit = 50;
config.logLevel = 'info';
```

---

### Environment-Specific Configuration

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

function createConfig(env: 'development' | 'staging' | 'production'): FirebaseConfig {
  const config = new FirebaseConfig();

  // Common settings
  config.folder = './migrations';
  config.tableName = 'schema_version';

  if (env === 'production') {
    // Production: separate database, with locking
    config.databaseUrl = process.env.PROD_DATABASE_URL;
    config.applicationCredentials = process.env.PROD_CREDENTIALS;
    config.backupMode = 'full';
    config.locking = {
      enabled: true,
      timeout: 600000
    };
  } else {
    // Dev/Staging: shared database with shift
    config.databaseUrl = process.env.DEV_DATABASE_URL;
    config.applicationCredentials = process.env.DEV_CREDENTIALS;
    config.shift = env; // Namespace: /development/* or /staging/*
    config.backupMode = 'manual';
  }

  return config;
}

// Usage
const config = createConfig('staging');
```

---

### Multi-Environment Database

Use shift to share one Firebase database across environments:

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

class MultiEnvConfig {
  static create(environment: string): FirebaseConfig {
    const config = new FirebaseConfig();
    config.databaseUrl = 'https://shared-db.firebaseio.com';
    config.applicationCredentials = './serviceAccountKey.json';
    config.shift = environment; // dev/staging/production

    // Each environment has isolated data:
    // /dev/users, /dev/posts
    // /staging/users, /staging/posts
    // /production/users, /production/posts

    return config;
  }
}

const devConfig = MultiEnvConfig.create('dev');
const stagingConfig = MultiEnvConfig.create('staging');
const prodConfig = MultiEnvConfig.create('production');
```

---

### Configuration from Environment

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';
import 'dotenv/config';

const config = new FirebaseConfig();

// Automatically reads from process.env
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = process.env.MIGRATIONS_FOLDER || './migrations';
config.shift = process.env.FIREBASE_SHIFT;

// Parse boolean from env
config.locking.enabled = process.env.ENABLE_LOCKING === 'true';

// Parse number from env
config.displayLimit = parseInt(process.env.DISPLAY_LIMIT || '100', 10);

// Parse log level
config.logLevel = (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info';
```

---

### Load from JSON File

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';
import { readFileSync } from 'fs';

// Load configuration from JSON file
const configData = JSON.parse(readFileSync('.msrrc.json', 'utf-8'));

const config = new FirebaseConfig();
Object.assign(config, configData);

// Or specific properties
config.databaseUrl = configData.databaseUrl;
config.applicationCredentials = configData.applicationCredentials;
```

**Example `.msrrc.json`:**
```json
{
  "databaseUrl": "https://my-project.firebaseio.com",
  "applicationCredentials": "./serviceAccountKey.json",
  "folder": "./migrations",
  "tableName": "schema_version",
  "shift": "production",
  "backupMode": "full",
  "locking": {
    "enabled": true,
    "timeout": 600000
  }
}
```

---

### With Custom Logger

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { ConsoleLogger } from '@migration-script-runner/core';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  logger: new ConsoleLogger({ level: 'debug' })
});
```

---

## Configuration Priority

When using multiple configuration sources, the priority is:

1. **Programmatic Configuration** (highest priority)
   ```typescript
   config.databaseUrl = 'https://my-project.firebaseio.com';
   ```

2. **Environment Variables**
   ```bash
   export DATABASE_URL=https://my-project.firebaseio.com
   ```

3. **Default Values**
   ```typescript
   new FirebaseConfig() // Uses process.env by default
   ```

{: .note }
> CLI flags have higher priority than programmatic configuration when using the CLI. See [CLI Configuration](../cli-usage/configuration) for details.

---

## Best Practices

### 1. Use Environment Variables for Secrets

```typescript
// ✓ Good
config.databaseUrl = process.env.DATABASE_URL;

// ✗ Bad - hardcoded
config.databaseUrl = 'https://my-project.firebaseio.com';
```

### 2. Different Strategies per Environment

```typescript
// Development: Fast, no backups
config.backupMode = 'manual';

// Production: Safe, full backups
config.backupMode = 'full';
```

### 3. Enable Locking in Production

```typescript
config.locking = {
  enabled: process.env.NODE_ENV === 'production',
  timeout: 600000
};
```

### 4. Validate Configuration at Startup

```typescript
function validateConfig(config: FirebaseConfig) {
  if (!config.databaseUrl) {
    throw new Error('Firebase database URL is required');
  }
  if (!config.applicationCredentials) {
    throw new Error('Firebase credentials are required');
  }
}

validateConfig(config);
```

---

## See Also

- **[FirebaseConfig API](../api/FirebaseConfig)** - Complete API documentation
- **[CLI Configuration](../cli-usage/configuration)** - CLI flags and options
- **[MSR Core Config](https://migration-script-runner.github.io/msr-core/api/Config)** - Inherited configuration options
