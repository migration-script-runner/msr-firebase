---
layout: default
title: Configuration
parent: Guides
nav_order: 4
---

# Configuration
{: .no_toc }

Configure MSR Firebase for your specific needs.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Configuration Options

MSR Firebase can be configured through:
1. Constructor options
2. Environment variables
3. Configuration files

## Basic Configuration

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Optional: Configure database path prefix
appConfig.shift = '/production';

const runner = await FirebaseRunner.getInstance({ config: appConfig });
```

## Configuration Properties

### rollbackStrategy

How to handle migration rollbacks.

```typescript
rollbackStrategy: 'none' | 'down' | 'backup' | 'both'
```

- **none**: No automatic rollback
- **down**: Use migration `down()` functions
- **backup**: Use database backups
- **both**: Try `down()` first, fallback to backup

**Default:** `'down'`

**Example:**
```typescript
config: {
  rollbackStrategy: 'backup' // Use backups for rollback
}
```

### validateChecksums

Enable checksum validation for applied migrations.

```typescript
validateChecksums: boolean
```

**Default:** `true`

**Example:**
```typescript
config: {
  validateChecksums: true // Detect modified migration files
}
```

### transaction

Transaction configuration for migrations.

{: .warning }
**Firebase Limitation:** Firebase Realtime Database does NOT support database-wide transactions. MSR Firebase automatically sets `transaction.mode = TransactionMode.NONE`. See the [Transactions Guide](transactions) for details.

```typescript
transaction: {
  mode: TransactionMode.NONE  // Automatically set by FirebaseConfig
}
```

**Default:** `TransactionMode.NONE` (set automatically)

Firebase only supports single-node atomic operations via `ref.transaction()`. For safe migrations without database-wide transactions, use:
- Backup & restore operations
- Idempotent migrations
- Small, focused changes

See [Transactions Guide](transactions) for safe migration patterns.

### backupPath

Directory for storing database backups.

```typescript
backupPath?: string
```

**Default:** `'./backups'`

**Example:**
```typescript
config: {
  backupPath: '/var/backups/firebase'
}
```

### dryRun

Run migrations without applying changes (simulation mode).

```typescript
dryRun?: boolean
```

**Default:** `false`

**Example:**
```typescript
config: {
  dryRun: true // Simulate migrations
}
```

### locking

Configure migration locking to prevent concurrent migrations in distributed environments.

```typescript
locking?: {
  enabled: boolean;
  timeout?: number;
}
```

**Default:**
```typescript
{
  enabled: false,
  timeout: 600000  // 10 minutes
}
```

**Properties:**
- `enabled` - Enable/disable migration locking
- `timeout` - Lock timeout in milliseconds (default: 10 minutes)

**Example:**
```typescript
config: {
  locking: {
    enabled: true,
    timeout: 600000  // 10 minutes
  }
}
```

**When to enable:**
- Kubernetes deployments with multiple pods
- Docker Swarm with multiple replicas
- Auto-scaling environments
- CI/CD pipelines with parallel deployments
- Multi-region deployments

**See:** [Migration Locking Guide](migration-locking) for detailed information.

## Environment Variables

### Firebase Configuration

```bash
# Firebase project credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### MSR Configuration

```bash
# Migrations
MIGRATIONS_PATH=./migrations

# Rollback
ROLLBACK_STRATEGY=backup

# Validation
VALIDATE_CHECKSUMS=true

# Backups
BACKUP_PATH=./backups

# Transaction
TRANSACTION_ENABLED=true

# Logging
LOG_LEVEL=info
```

## Configuration File

Create a `.msrrc.json` file:

```json
{
  "migrationsPath": "./migrations",
  "rollbackStrategy": "backup",
  "validateChecksums": true,
  "backupPath": "./backups",
  "firebase": {
    "databaseURL": "https://your-project.firebaseio.com"
  }
}
```

{: .note }
Transaction mode is automatically set to `NONE` for Firebase. No manual configuration needed.

Load configuration:

```typescript
import { readFileSync } from 'fs';
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const configData = JSON.parse(readFileSync('.msrrc.json', 'utf-8'));

const appConfig = new FirebaseConfig();
Object.assign(appConfig, configData);

const runner = await FirebaseRunner.getInstance({ config: appConfig });
```

## Environment-Specific Configuration

### Development

```typescript
// config/development.ts
export const config = {
  firebase: {
    databaseURL: 'http://localhost:9000'
  },
  migrationsPath: './migrations',
  rollbackStrategy: 'down' as const,
  validateChecksums: false,
  dryRun: false
};
```

### Staging

```typescript
// config/staging.ts
export const config = {
  firebase: {
    databaseURL: process.env.FIREBASE_DATABASE_URL
  },
  migrationsPath: './migrations',
  rollbackStrategy: 'backup' as const,
  validateChecksums: true,
  backupPath: './backups/staging'
};
```

### Production

```typescript
// config/production.ts
export const config = {
  firebase: {
    databaseURL: process.env.FIREBASE_DATABASE_URL
  },
  migrationsPath: './migrations',
  rollbackStrategy: 'both' as const,
  validateChecksums: true,
  backupPath: '/var/backups/firebase',
  locking: {
    enabled: true,        // Enable locking in production
    timeout: 600000      // 10 minutes
  }
  // Note: transaction.mode is automatically set to NONE for Firebase
};
```

## Loading Configuration by Environment

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const env = process.env.NODE_ENV || 'development';
const configData = require(`./config/${env}`).config;

const appConfig = new FirebaseConfig();
Object.assign(appConfig, configData);

const runner = await FirebaseRunner.getInstance({ config: appConfig });
```

## Logging Configuration

Configure logging level:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { ConsoleLogger } from '@migration-script-runner/core';

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const logger = new ConsoleLogger({
  level: 'debug' // 'error' | 'warn' | 'info' | 'debug'
});

const runner = await FirebaseRunner.getInstance({
  config: appConfig,
  logger: logger
});
```

## Custom Logger

Implement a custom logger:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { ILogger } from '@migration-script-runner/core';

class CustomLogger implements ILogger {
  info(message: string): void {
    // Custom info logging
  }

  warn(message: string): void {
    // Custom warning logging
  }

  error(message: string, error?: Error): void {
    // Custom error logging
  }
}

const appConfig = new FirebaseConfig();
appConfig.folder = './migrations';
appConfig.tableName = 'schema_version';
appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const runner = await FirebaseRunner.getInstance({
  config: appConfig,
  logger: new CustomLogger()
});
```

## Best Practices

### 1. Use Environment Variables for Secrets

```typescript
// ✓ Good
databaseURL: process.env.FIREBASE_DATABASE_URL

// ✗ Bad - hardcoded
databaseURL: 'https://my-project.firebaseio.com'
```

### 2. Different Strategies per Environment

```typescript
// Development: Fast rollback with down()
rollbackStrategy: 'down'

// Production: Safe rollback with backups
rollbackStrategy: 'backup'
```

### 3. Enable Validation in Production

```typescript
config: {
  validateChecksums: process.env.NODE_ENV === 'production'
}
```

### 4. Separate Backup Paths

```typescript
backupPath: `./backups/${process.env.NODE_ENV}`
```

## Configuration Validation

Validate configuration at startup:

```typescript
function validateConfig(config: any) {
  if (!config.firebase?.databaseURL) {
    throw new Error('Firebase database URL is required');
  }

  if (!config.migrationsPath) {
    throw new Error('Migrations path is required');
  }

  // Additional validation...
}

validateConfig(config);
```

## See Also

- [CLI Usage](cli-usage) - CLI configuration
- [Getting Started](../getting-started) - Basic setup
- [Backup & Restore](backup-restore) - Backup configuration
