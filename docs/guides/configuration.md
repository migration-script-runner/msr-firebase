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

## Constructor Configuration

```typescript
import { FirebaseRunner } from '@migration-script-runner/firebase';
import * as admin from 'firebase-admin';

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  config: {
    rollbackStrategy: 'backup',
    validateChecksums: true,
    transactionEnabled: true,
    backupPath: './backups',
    dryRun: false
  }
});
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

### transactionEnabled

Enable transaction support (where applicable).

```typescript
transactionEnabled: boolean
```

**Default:** `true`

**Example:**
```typescript
config: {
  transactionEnabled: false // Disable transactions
}
```

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
  "transactionEnabled": true,
  "backupPath": "./backups",
  "firebase": {
    "databaseURL": "https://your-project.firebaseio.com"
  }
}
```

Load configuration:

```typescript
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('.msrrc.json', 'utf-8'));

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: config.migrationsPath,
  config: config
});
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
  transactionEnabled: true,
  locking: {
    enabled: true,        // Enable locking in production
    timeout: 600000      // 10 minutes
  }
};
```

## Loading Configuration by Environment

```typescript
const env = process.env.NODE_ENV || 'development';
const config = require(`./config/${env}`).config;

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: config.migrationsPath,
  config: config
});
```

## Logging Configuration

Configure logging level:

```typescript
import { ConsoleLogger } from '@migration-script-runner/core';

const logger = new ConsoleLogger({
  level: 'debug' // 'error' | 'warn' | 'info' | 'debug'
});

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
  logger: logger
});
```

## Custom Logger

Implement a custom logger:

```typescript
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

const runner = new FirebaseRunner({
  db: admin.database(),
  migrationsPath: './migrations',
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
