---
layout: default
title: Examples
parent: Library Usage
nav_order: 3
---

# Library Usage Examples
{: .no_toc }

Real-world examples and advanced usage patterns for programmatic usage.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Complete Migration Workflow

Full workflow with validation and backup:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function runMigrations() {
  // 1. Setup configuration
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.shift = process.env.NODE_ENV; // dev/staging/production

  // 2. Create runner
  const runner = await FirebaseRunner.getInstance({ config });

  // 3. List current state
  const migrations = await runner.list();
  console.log(`Found ${migrations.length} migrations`);

  // 4. Validate before running
  const validation = await runner.validate();
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    return;
  }

  // 5. Create backup (optional but recommended)
  await runner.backup();

  // 6. Run migrations
  const result = await runner.migrate();
  console.log(`Applied ${result.executed.length} migrations`);
}

runMigrations().catch(console.error);
```

---

## With Error Handling and Rollback

Automatic rollback on migration failure:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function safeMigrate() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });

  try {
    // Create backup before migration
    const backup = await runner.backup();
    console.log('Backup created:', backup.id);

    // Run migrations
    const result = await runner.migrate();

    if (result.success) {
      console.log('✓ Migrations successful');
    } else {
      console.error('✗ Migrations failed:', result.errors);

      // Restore from backup
      await runner.restore(backup.id);
      console.log('Restored from backup');
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

safeMigrate();
```

---

## Production Setup with Locking

Enable migration locking for distributed environments:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function productionMigrate() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.backupMode = 'full';

  // Enable locking for distributed environments
  config.locking = {
    enabled: true,
    timeout: 600000 // 10 minutes
  };

  const runner = await FirebaseRunner.getInstance({ config });

  try {
    // Locking is handled automatically
    const result = await runner.migrate();
    console.log('Migration result:', result);
  } catch (error) {
    if (error.message.includes('lock')) {
      console.error('Another migration is running. Please wait.');
    } else {
      throw error;
    }
  }
}
```

---

## Application Startup Integration

Run migrations when your application starts:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import express from 'express';

async function startServer() {
  // Run migrations before starting server
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  try {
    console.log('Running migrations...');
    const runner = await FirebaseRunner.getInstance({ config });
    const result = await runner.migrate();
    console.log(`✓ Applied ${result.executed.length} migrations`);
  } catch (error) {
    console.error('✗ Migrations failed:', error);
    process.exit(1);
  }

  // Start server only after successful migrations
  const app = express();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
}

startServer();
```

---

## Using Firebase Database Reference

Access Firebase database directly for custom operations:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function inspectDatabase() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config });

  // Get Firebase database reference
  const db = runner.getDatabase();

  // Perform custom operations
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');
  const users = snapshot.val();

  console.log('Users:', users);

  // List all root nodes
  const nodes = await runner.listNodes();
  console.log('Root nodes:', nodes);
}

inspectDatabase();
```

---

## Backup Specific Nodes

Backup selective data before risky operations:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function backupBeforeOperation() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config });

  // Backup specific nodes before risky migration
  const backup = await runner.backupNodes(['users', 'posts', 'settings']);
  console.log('Backed up nodes:', Object.keys(backup));

  try {
    // Run migrations
    await runner.migrate();
  } catch (error) {
    console.error('Migration failed:', error);

    // Restore specific nodes from backup
    const db = runner.getDatabase();
    await db.ref('users').set(backup.users);
    await db.ref('posts').set(backup.posts);
    console.log('Restored from backup');
  }
}

backupBeforeOperation();
```

---

## With Custom Lifecycle Hooks

Add custom behavior at different migration stages:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  hooks: {
    beforeMigrate: async (info) => {
      console.log(`📝 Starting migration: ${info.name}`);
      // Send notification, update status, etc.
    },
    afterMigrate: async (info, result) => {
      console.log(`✅ Completed: ${info.name} - ${result}`);
      // Log to monitoring system
    },
    onError: async (error) => {
      console.error('❌ Migration error:', error);
      // Send alert, rollback, etc.
    }
  }
});

await runner.migrate();
```

---

## With Metrics Collection

Track migration performance:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import { IMetricsCollector } from '@migration-script-runner/core';

class CustomMetricsCollector implements IMetricsCollector {
  async recordMigration(name: string, duration: number, success: boolean): Promise<void> {
    console.log(`Migration ${name}: ${duration}ms (${success ? 'success' : 'failure'})`);
    // Send to monitoring service (Datadog, Prometheus, etc.)
  }

  async recordError(name: string, error: Error): Promise<void> {
    console.error(`Migration ${name} failed:`, error);
    // Send to error tracking service (Sentry, etc.)
  }
}

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({
  config,
  metricsCollectors: [new CustomMetricsCollector()]
});

await runner.migrate();
```

---

## Targeted Migration Execution

Run migrations to a specific version:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function migrateToVersion(targetVersion: string) {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });

  // List migrations to see available versions
  const migrations = await runner.list();
  console.log('Available migrations:');
  migrations.forEach(m => {
    console.log(`  ${m.name} - ${m.status}`);
  });

  // Run migrations up to target version
  const result = await runner.migrate(targetVersion);
  console.log(`Migrated to version ${targetVersion}`);
  console.log(`Executed: ${result.executed.map(m => m.name).join(', ')}`);
}

migrateToVersion('202501200003');
```

---

## Dry Run Mode

Simulate migrations without applying changes:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function dryRunMigrations() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.dryRun = true; // Simulation mode

  const runner = await FirebaseRunner.getInstance({ config });

  console.log('🔍 Running in DRY RUN mode (no changes will be applied)');

  const result = await runner.migrate();
  console.log('Would execute migrations:');
  result.executed.forEach(m => {
    console.log(`  - ${m.name}`);
  });
}

dryRunMigrations();
```

---

## Multi-Environment Management

Manage migrations across multiple environments:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

interface Environment {
  name: string;
  databaseUrl: string;
  credentials: string;
  shift: string;
}

async function migrateAllEnvironments(environments: Environment[]) {
  for (const env of environments) {
    console.log(`\n📦 Migrating ${env.name}...`);

    const config = new FirebaseConfig();
    config.databaseUrl = env.databaseUrl;
    config.applicationCredentials = env.credentials;
    config.shift = env.shift;
    config.folder = './migrations';

    try {
      const runner = await FirebaseRunner.getInstance({ config });
      const result = await runner.migrate();
      console.log(`✓ ${env.name}: Applied ${result.executed.length} migrations`);
    } catch (error) {
      console.error(`✗ ${env.name} failed:`, error);
    }
  }
}

const environments: Environment[] = [
  {
    name: 'Development',
    databaseUrl: process.env.DEV_DATABASE_URL!,
    credentials: './dev-key.json',
    shift: 'development'
  },
  {
    name: 'Staging',
    databaseUrl: process.env.STAGING_DATABASE_URL!,
    credentials: './staging-key.json',
    shift: 'staging'
  },
  {
    name: 'Production',
    databaseUrl: process.env.PROD_DATABASE_URL!,
    credentials: './prod-key.json',
    shift: 'production'
  }
];

migrateAllEnvironments(environments);
```

---

## Connection Info Inspection

Check Firebase connection details:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function inspectConnection() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.shift = 'production';

  const runner = await FirebaseRunner.getInstance({ config });

  // Get connection information
  const info = runner.getConnectionInfo();
  console.log('Firebase Connection:');
  console.log('  Database URL:', info.databaseUrl);
  console.log('  Shift Path:', info.shift);
  console.log('  Table Name:', info.tableName);

  // List root nodes
  const nodes = await runner.listNodes();
  console.log('  Root Nodes:', nodes.join(', '));
}

inspectConnection();
```

---

## See Also

- **[Quick Start](quick-start)** - Basic usage examples
- **[Configuration](configuration)** - Configuration options
- **[API Reference](../api/)** - Complete API documentation
- **[MSR Core Examples](https://migration-script-runner.github.io/msr-core/examples/)** - Additional examples from MSR Core
