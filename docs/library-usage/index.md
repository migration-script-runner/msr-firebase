---
layout: default
title: Library Usage
nav_order: 5
has_children: true
---

# Library Usage
{: .no_toc }

Complete guide for using MSR Firebase programmatically in your Node.js applications.
{: .fs-6 .fw-300 }

## Quick Start

Install and use MSR Firebase programmatically:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

// Configure
const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

// Create runner and execute migrations
const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

## Library Sections

### [Quick Start](quick-start)
Basic programmatic usage examples to get started quickly.

### [Configuration](configuration)
Programmatic configuration using FirebaseConfig class and options.

### [API Reference](../api/)
Complete API documentation for Firebase-specific classes and methods.

### [Examples](examples)
Real-world usage patterns and advanced scenarios.

---

## Common Operations

### Run Migrations

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = 'https://your-project.firebaseio.com';
config.applicationCredentials = './serviceAccountKey.json';
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({ config });
const result = await runner.migrate();

console.log(`Applied ${result.executed.length} migrations`);
```

### Check Migration Status

```typescript
const migrations = await runner.list();

migrations.forEach(m => {
  console.log(`${m.name}: ${m.status}`);
});
```

### Rollback Migrations

```typescript
// Rollback to specific version
await runner.down('202501150001');

// Or rollback one migration
const result = await runner.down();
console.log(`Rolled back: ${result.executed[0].name}`);
```

---

## Firebase-Specific Features

MSR Firebase extends MSR Core with Firebase-specific functionality:

### FirebaseRunner Methods

- **`getConnectionInfo()`** - Get Firebase connection details
- **`getDatabase()`** - Access Firebase database reference directly
- **`listNodes()`** - List all root nodes in database
- **`backupNodes(nodes)`** - Backup specific nodes to JSON

### FirebaseConfig Properties

- **`databaseUrl`** - Firebase Realtime Database URL
- **`applicationCredentials`** - Path to service account key file
- **`shift`** - Root path prefix for multi-environment databases

---

## Inherited Functionality

MSR Firebase inherits standard migration functionality from MSR Core:

### Migration Operations

- **`migrate(targetVersion?)`** - Run pending migrations
- **`down(targetVersion)`** - Rollback migrations
- **`list()`** - List all migrations with status
- **`validate()`** - Validate migration scripts

### Data Operations

- **`backup()`** - Create database backup
- **`restore(backupId)`** - Restore from backup

{: .note }
> **Full documentation:** For detailed documentation of inherited methods, configuration options, and interfaces, see [MSR Core API Documentation](https://migration-script-runner.github.io/msr-core/api/).

---

## When to Use Library vs CLI

**Use the Library when:**
- Integrating migrations into your application startup
- Need programmatic control over migrations
- Building custom migration workflows
- Require access to Firebase database reference
- Want to add custom hooks or metrics collection

**Use the CLI when:**
- Running migrations manually
- Integrating with CI/CD pipelines
- Need simple command-line interface
- Running migrations as separate process

See [CLI Usage](../cli-usage/) for command-line interface documentation.
