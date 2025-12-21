---
layout: default
title: FirebaseConfig
parent: API Reference
nav_order: 2
---

# FirebaseConfig
{: .no_toc }

Configuration class for Firebase Realtime Database migrations.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

`FirebaseConfig` extends MSR Core's `Config` class to provide Firebase-specific configuration options for migrations.

**Inheritance:** Extends [`Config`](https://migration-script-runner.github.io/msr-core/api/Config) from MSR Core

## Class Signature

```typescript
class FirebaseConfig extends Config
```

---

## Firebase-Specific Properties

### databaseUrl

Firebase Realtime Database URL.

```typescript
databaseUrl: string | undefined
```

**Default:** `process.env.DATABASE_URL`

**Example:**
```typescript
config.databaseUrl = 'https://your-project.firebaseio.com';
```

---

### applicationCredentials

Path to Firebase service account key JSON file.

```typescript
applicationCredentials: string | undefined
```

**Default:** `process.env.GOOGLE_APPLICATION_CREDENTIALS`

**Example:**
```typescript
config.applicationCredentials = './serviceAccountKey.json';
```

---

### shift

Root path prefix for multi-environment database namespacing.

```typescript
shift: string | undefined
```

**Default:** `undefined` (root level)

**Use Case:** Store multiple environments in a single Firebase database

**Example:**
```typescript
// Different environments in same database
config.shift = 'production';  // Data at /production/*
config.shift = 'staging';     // Data at /staging/*
config.shift = 'development'; // Data at /development/*
```

---

### tableName

Name of the migration tracking node in Firebase.

```typescript
tableName: string
```

**Default:** `'schema_version'`

**Example:**
```typescript
config.tableName = 'migrations';
```

---

## Standard MSR Properties

FirebaseConfig inherits all standard configuration properties from MSR Core's `Config` class:

### folder

Path to migrations directory.

```typescript
folder: string
```

**Default:** `'./migrations'`

**Example:**
```typescript
config.folder = './db/migrations';
```

---

### locking

Migration locking configuration for distributed environments.

```typescript
locking: {
  enabled: boolean;
  timeout: number;
}
```

**Default:** `{ enabled: false, timeout: 600000 }`

**Example:**
```typescript
config.locking = {
  enabled: true,        // Enable in production
  timeout: 600000       // 10 minutes
};
```

---

### transaction

Transaction configuration (Firebase uses `TransactionMode.NONE`).

```typescript
transaction: {
  mode: TransactionMode;
}
```

**Default:** `{ mode: TransactionMode.NONE }`

{: .note }
> Firebase Realtime Database does not support database-wide transactions. MSR Firebase automatically sets this to `NONE`. See [Transaction Guide](../guides/transactions) for details.

---

### displayLimit

Maximum number of migrations to display in CLI output.

```typescript
displayLimit: number
```

**Default:** `100`

---

### logLevel

Logging verbosity level.

```typescript
logLevel: 'error' | 'warn' | 'info' | 'debug'
```

**Default:** `'info'`

---

## Methods

### buildPath()

Constructs a full Firebase path with shift prefix.

```typescript
buildPath(path: string): string
```

#### Parameters

**path** - `string`
Path segment to append to shift prefix

#### Returns

`string` - Full path including shift prefix

#### Example

```typescript
const config = new FirebaseConfig();
config.shift = 'production';

config.buildPath('users');     // Returns: 'production/users'
config.buildPath('posts/123'); // Returns: 'production/posts/123'
```

---

### getRoot()

Gets the root path including shift prefix.

```typescript
getRoot(): string
```

#### Returns

`string` - Root path with trailing slash

#### Example

```typescript
const config = new FirebaseConfig();
config.shift = 'staging';

const root = config.getRoot(); // Returns: 'staging/'
```

---

## Usage Examples

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

// Locking (production only)
config.locking = {
  enabled: process.env.NODE_ENV === 'production',
  timeout: 600000 // 10 minutes
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
    config.locking = {
      enabled: true,
      timeout: 600000
    };
  } else {
    // Dev/Staging: shared database with shift
    config.databaseUrl = process.env.DEV_DATABASE_URL;
    config.applicationCredentials = process.env.DEV_CREDENTIALS;
    config.shift = env; // Namespace: /development/* or /staging/*
  }

  return config;
}

// Usage
const config = createConfig('staging');
```

---

### Multi-Environment Database

```typescript
import { FirebaseConfig } from '@migration-script-runner/firebase';

// Share one Firebase database across environments using shift
class MultiEnvConfig {
  static create(environment: string): FirebaseConfig {
    const config = new FirebaseConfig();
    config.databaseUrl = 'https://shared-db.firebaseio.com';
    config.applicationCredentials = './serviceAccountKey.json';
    config.shift = environment; // dev/staging/production

    // Each environment has isolated data
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
config.logLevel = (process.env.LOG_LEVEL as any) || 'info';
```

---

## Configuration Priority

Configuration can be set via multiple sources (in order of priority):

1. **CLI Flags** (highest priority)
   ```bash
   npx msr-firebase migrate \
     --database-url https://my-project.firebaseio.com \
     --credentials ./key.json
   ```

2. **Programmatic Configuration**
   ```typescript
   config.databaseUrl = 'https://my-project.firebaseio.com';
   ```

3. **Environment Variables**
   ```bash
   export DATABASE_URL=https://my-project.firebaseio.com
   ```

4. **Default Values**
   ```typescript
   new FirebaseConfig() // Uses process.env by default
   ```

