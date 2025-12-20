---
layout: default
title: Commands
parent: CLI Usage
nav_order: 1
---

# Firebase-Specific Commands
{: .no_toc }

Commands unique to MSR Firebase for database inspection and management.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## firebase:info

Show Firebase connection information.

```bash
npx msr-firebase firebase:info
```

**Output:**
```
📊 Firebase Connection Information:

  Database URL: https://your-project.firebaseio.com
  Shift Path:   /production
  Table Name:   schema_version
```

**Use Cases:**
- Verify connection settings
- Check which environment you're connected to
- Debug configuration issues

---

## firebase:test-connection

Test Firebase database connection.

```bash
npx msr-firebase firebase:test-connection \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

**Output:**
```
✅ Firebase connection successful!
   Connected to: https://your-project.firebaseio.com
```

**Use Cases:**
- Validate credentials before running migrations
- Test connectivity in CI/CD pipelines
- Verify firewall/network access

---

## firebase:nodes

List all root nodes in Firebase database.

```bash
npx msr-firebase firebase:nodes
```

**Output:**
```
📂 Root Nodes:

  1. users
  2. posts
  3. schema_version
  4. settings

  Total: 4 nodes
```

**Use Cases:**
- Inspect database structure
- Verify migrations created expected nodes
- Database exploration and debugging

**With Shift Path:**
```bash
# Lists nodes under /production/*
npx msr-firebase firebase:nodes --database-url https://... --shift production
```

---

## firebase:backup-nodes

Backup specific Firebase nodes to JSON.

```bash
npx msr-firebase firebase:backup-nodes <nodes...> [options]
```

**Arguments:**
- `<nodes...>` - Node paths to backup (space-separated)

**Examples:**

### Backup Single Node

```bash
npx msr-firebase firebase:backup-nodes users
```

**Output:**
```
💾 Node Backup:

  ✅ users: 15234 bytes

📄 Backup Data:

{
  "users": {
    "user1": { "name": "Alice", "email": "alice@example.com" },
    "user2": { "name": "Bob", "email": "bob@example.com" }
  }
}
```

### Backup Multiple Nodes

```bash
npx msr-firebase firebase:backup-nodes users posts settings
```

### Backup Non-Existent Node

```bash
npx msr-firebase firebase:backup-nodes missing_node
```

**Output:**
```
💾 Node Backup:

  ⚠️  missing_node: (not found)

📄 Backup Data:

{
  "missing_node": null
}
```

**Use Cases:**
- Backup specific data before risky operations
- Export data for analysis or migration
- Create selective backups for testing

---

## Standard Migration Commands

MSR Firebase inherits standard migration commands from MSR Core:

### migrate

Run pending migrations.

```bash
npx msr-firebase migrate [targetVersion] [options]
```

### down / rollback

Roll back migrations.

```bash
npx msr-firebase down <targetVersion>
```

### list

List all migrations with status.

```bash
npx msr-firebase list [options]
```

### validate

Validate migration scripts.

```bash
npx msr-firebase validate
```

### backup

Create database backup.

```bash
npx msr-firebase backup
```

### restore

Restore from backup (not yet implemented in Firebase adapter).

```bash
npx msr-firebase restore <backupPath>
```

### lock:status

Check migration lock status.

```bash
npx msr-firebase lock:status
```

### lock:release

Force release migration lock.

```bash
npx msr-firebase lock:release [options]
```

{: .note }
> **Full Documentation:** For detailed documentation of standard migration commands, see [MSR Core CLI Documentation](https://migration-script-runner.github.io/msr-core/guides/cli-usage).
