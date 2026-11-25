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

  Database URL: https://DATABASE-NAME.REGION.firebasedatabase.app
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
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./serviceAccountKey.json
```

**Output:**
```
✅ Firebase connection successful!
   Connected to: https://DATABASE-NAME.REGION.firebasedatabase.app
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
npx msr-firebase down "<targetVersion>"
```

`targetVersion` is a numeric migration version. Migrations newer than that target are rolled back.

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

Create, restore, or delete a backup using the Core CLI subcommands.

```bash
npx msr-firebase backup create
npx msr-firebase backup restore "<backupPath>"
```

Use the file path printed by `backup create` with `backup restore`. The CLI starts a new runner process for each command, so it cannot infer the previous command's in-memory backup path when the argument is omitted. The Core CLI also exposes `backup delete`, but that command has no path argument and a fresh runner has no current backup file; manage retained files through your own storage and retention process instead. Review [Backup & Restore](../writing-migrations/backup-restore) before restoring production data.

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
> **Full Documentation:** For detailed documentation of standard migration commands, see the [MSR Core CLI Reference](https://core.migration-script-runner.dev/api/cli-reference).
