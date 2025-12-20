---
layout: default
title: Custom Commands
parent: Examples
nav_order: 3
---

# Custom Commands
{: .no_toc }

Examples of creating custom migration commands and scripts.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Custom Migration Script

Create a custom script with logging:

```typescript
// scripts/migrate-with-logging.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function migrateWithLogging() {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    console.log('🚀 Starting database migrations...');
    console.log(`   Database: ${appConfig.databaseUrl}`);
    console.log(`   Migrations: ${appConfig.folder}`);

    const runner = await FirebaseRunner.getInstance({ config: appConfig });

    const result = await runner.migrate();

    console.log(`\n✓ Successfully applied ${result.executed.length} migrations`);
    result.executed.forEach(m => {
      console.log(`  ✓ ${m.name} (${m.checksum})`);
    });

    return 0;
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    return 1;
  }
}

migrateWithLogging()
  .then(code => process.exit(code));
```

## Safe Migration with Backup

Create backups before migrating:

```typescript
// scripts/safe-migrate.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import * as path from 'path';

async function safeMigrate() {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    // Step 1: Check pending migrations
    console.log('1. Checking pending migrations...');
    const statuses = await runner.list();
    const pending = statuses.filter(s => s.status === 'pending');

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return 0;
    }

    console.log(`Found ${pending.length} pending migrations:`);
    pending.forEach(m => console.log(`  - ${m.name}`));

    // Step 2: Create backup
    console.log('\n2. Creating backup...');
    const backupPath = await runner.backup();
    console.log(`✓ Backup created: ${backupPath}`);

    // Step 3: Apply migrations
    console.log('\n3. Applying migrations...');
    const result = await runner.migrate();

    console.log(`✓ Successfully applied ${result.executed.length} migrations`);

    return 0;
  } catch (error) {
    console.error('✗ Migration failed:', error);
    console.error('   You can restore from backup if needed.');
    return 1;
  }
}

safeMigrate()
  .then(code => process.exit(code));
```

## List Firebase Nodes

Custom command to list all root nodes:

```typescript
// scripts/list-nodes.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function listFirebaseNodes() {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  appConfig.shift = process.env.FIREBASE_SHIFT || '/';

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    const nodes = await runner.listNodes();

    if (nodes.length === 0) {
      console.log('No nodes found in database');
      return 0;
    }

    console.log(`\nFirebase nodes at ${appConfig.shift}:`);
    console.log('─'.repeat(40));
    nodes.forEach(node => {
      console.log(`  📁 ${node}`);
    });
    console.log(`\nTotal: ${nodes.length} nodes`);

    return 0;
  } catch (error) {
    console.error('Failed to list nodes:', error);
    return 1;
  }
}

listFirebaseNodes()
  .then(code => process.exit(code));
```

## Backup Specific Nodes

Backup only certain Firebase nodes:

```typescript
// scripts/backup-nodes.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import * as fs from 'fs';
import * as path from 'path';

async function backupSpecificNodes(nodeNames: string[]) {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  appConfig.shift = process.env.FIREBASE_SHIFT;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    console.log(`Backing up nodes: ${nodeNames.join(', ')}`);

    const backup = await runner.backupNodes(nodeNames);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-nodes-${timestamp}.json`;
    const backupPath = path.join('./backups', filename);

    // Ensure backups directory exists
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups', { recursive: true });
    }

    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✓ Backup saved: ${backupPath}`);
    console.log(`  Nodes backed up: ${Object.keys(backup).length}`);

    return 0;
  } catch (error) {
    console.error('Backup failed:', error);
    return 1;
  }
}

// Usage: ts-node scripts/backup-nodes.ts users posts comments
const nodes = process.argv.slice(2);
if (nodes.length === 0) {
  console.error('Usage: ts-node scripts/backup-nodes.ts <node1> <node2> ...');
  process.exit(1);
}

backupSpecificNodes(nodes)
  .then(code => process.exit(code));
```

## Interactive Migration

Prompt user for confirmation:

```typescript
// scripts/interactive-migrate.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
import * as readline from 'readline';

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function interactiveMigrate() {
  const appConfig = new FirebaseConfig();
  appConfig.folder = './migrations';
  appConfig.tableName = 'schema_version';
  appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const runner = await FirebaseRunner.getInstance({ config: appConfig });

  try {
    // Show pending migrations
    const statuses = await runner.list();
    const pending = statuses.filter(s => s.status === 'pending');

    if (pending.length === 0) {
      console.log('No pending migrations');
      return 0;
    }

    console.log(`\nFound ${pending.length} pending migrations:`);
    pending.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name}`);
    });

    // Ask for confirmation
    const answer = await askQuestion('\nApply these migrations? (y/N): ');

    if (answer.toLowerCase() !== 'y') {
      console.log('Migration cancelled');
      return 0;
    }

    // Apply migrations
    console.log('\nApplying migrations...');
    const result = await runner.migrate();

    console.log(`✓ Successfully applied ${result.executed.length} migrations`);

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  }
}

interactiveMigrate()
  .then(code => process.exit(code));
```

## Migration with Metrics

Track migration performance:

```typescript
// scripts/migrate-with-metrics.ts
import { FirebaseHandler, FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function migrateWithMetrics() {
  const config = new FirebaseConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const handler = await FirebaseHandler.getInstance(config);
  const runner = new FirebaseRunner({ handler, config });

  try {
    console.log('Starting migrations...');
    const startTime = Date.now();

    const result = await runner.migrate();

    const duration = Date.now() - startTime;
    const avgTime = result.executed.length > 0 ? duration / result.executed.length : 0;

    // Print metrics
    console.log('\n📊 Migration Metrics:');
    console.log('─'.repeat(60));
    console.log(`Total migrations: ${result.executed.length}`);
    console.log(`Total time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Average time: ${(avgTime / 1000).toFixed(2)}s per migration`);
    console.log('─'.repeat(60));

    result.executed.forEach(m => {
      console.log(`✓ ${m.name}`);
    });

    return 0;
  } catch (error) {
    console.error('Migration failed:', error);
    return 1;
  }
}

migrateWithMetrics()
  .then(code => process.exit(code));
```

## Migration with Locking

Production-safe migration with distributed locking:

```typescript
// scripts/migrate-production.ts
import { FirebaseHandler, FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function migrateProduction() {
  const config = new FirebaseConfig();
  config.folder = './migrations';
  config.tableName = 'schema_version';
  config.databaseUrl = process.env.FIREBASE_DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Enable locking for production
  config.locking = {
    enabled: true,
    timeout: 600000,     // 10 minutes
    retryAttempts: 5,
    retryDelay: 10000    // 10 seconds
  };

  try {
    console.log('🔒 Production migration with locking enabled');
    console.log(`   Timeout: ${config.locking.timeout}ms`);
    console.log(`   Retry attempts: ${config.locking.retryAttempts}`);

    const handler = await FirebaseHandler.getInstance(config);
    const runner = new FirebaseRunner({ handler, config });

    const result = await runner.migrate();

    console.log(`\n✓ Successfully applied ${result.executed.length} migrations`);
    return 0;
  } catch (error) {
    if (error.message && error.message.includes('lock')) {
      console.error('\n✗ Could not acquire migration lock');
      console.error('   Another migration may be running');
      console.error('   Check status: npx msr-firebase lock:status');
      console.error('   Force release: npx msr-firebase lock:release --force');
    } else {
      console.error('\n✗ Migration failed:', error);
    }
    return 1;
  }
}

migrateProduction()
  .then(code => process.exit(code));
```

## Add to package.json

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate-with-logging.ts",
    "migrate:safe": "ts-node scripts/safe-migrate.ts",
    "migrate:interactive": "ts-node scripts/interactive-migrate.ts",
    "migrate:metrics": "ts-node scripts/migrate-with-metrics.ts",
    "migrate:prod": "ts-node scripts/migrate-production.ts",
    "nodes:list": "ts-node scripts/list-nodes.ts",
    "nodes:backup": "ts-node scripts/backup-nodes.ts"
  }
}
```

## Usage

```bash
# Safe migration with backup
npm run migrate:safe

# Interactive migration
npm run migrate:interactive

# Migration with performance metrics
npm run migrate:metrics

# Production migration with locking
npm run migrate:prod

# List Firebase nodes
npm run nodes:list

# Backup specific nodes
npm run nodes:backup users posts comments
```
