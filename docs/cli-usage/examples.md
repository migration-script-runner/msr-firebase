---
layout: default
title: Examples
parent: CLI Usage
nav_order: 3
---

# CLI Examples
{: .no_toc }

Real-world CLI workflows and usage patterns.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Quick Start

### Basic Migration

Run migrations with inline credentials:

```bash
npx msr-firebase migrate \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./serviceAccountKey.json
```

### Using Environment Variables

```bash
# Set environment variables
export DATABASE_URL=https://DATABASE-NAME.REGION.firebasedatabase.app
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Run migrations
npx msr-firebase migrate
```

---

## Common Workflows

### Pre-Migration Check

Always validate before running migrations:

```bash
# 1. Test connection
npx msr-firebase firebase:test-connection \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./key.json

# 2. List pending migrations
npx msr-firebase list

# 3. Validate migration files
npx msr-firebase validate

# 4. Run migrations
npx msr-firebase migrate \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./key.json
```

### Safe Migration with Backup

Use Core's full backup mode to create a backup before migration and restore it automatically if migration execution fails:

```bash
npx msr-firebase migrate \
  --database-url "$DATABASE_URL" \
  --credentials "$GOOGLE_APPLICATION_CREDENTIALS" \
  --backup-mode full
```

For a separate manual backup, run `npx msr-firebase backup create`; the command prints the file path. Review [Backup & Restore](../writing-migrations/backup-restore) before manually restoring data.

### Dry Run First

Preview changes without applying:

```bash
# Dry run to see what would happen
npx msr-firebase migrate --dry-run \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./key.json

# If satisfied, run for real
npx msr-firebase migrate \
  --database-url https://DATABASE-NAME.REGION.firebasedatabase.app \
  --credentials ./key.json
```

---

## Environment-Specific Usage

### Development (Local Emulator)

```bash
# Start Firebase emulator
firebase emulators:start --only database

# Run migrations against local emulator
npx msr-firebase migrate \
  --database-url http://localhost:9000?ns=my-project-dev \
  --credentials ./dev-key.json \
  --backup-mode manual
```

### Staging

```bash
# Using config file
npx msr-firebase migrate --config-file ./msr.config.staging.js

# Or with environment-specific .env
export $(cat .env.staging | xargs)
npx msr-firebase migrate
```

### Production

```bash
# Production with full safety measures
npx msr-firebase migrate \
  --database-url https://PRODUCTION-DATABASE.REGION.firebasedatabase.app \
  --credentials ./prod-key.json \
  --backup-mode full \
  --log-level info
```

---

## Multi-Environment Database

Using shift paths to namespace environments in a single database:

```bash
# Development environment
npx msr-firebase migrate \
  --database-url https://SHARED-DATABASE.REGION.firebasedatabase.app \
  --credentials ./key.json \
  --shift development

# Staging environment
npx msr-firebase migrate \
  --database-url https://SHARED-DATABASE.REGION.firebasedatabase.app \
  --credentials ./key.json \
  --shift staging

# Production environment
npx msr-firebase migrate \
  --database-url https://SHARED-DATABASE.REGION.firebasedatabase.app \
  --credentials ./key.json \
  --shift production
```

**Result:**
```
/development/users
/development/posts
/staging/users
/staging/posts
/production/users
/production/posts
```

---

## Rollback Scenarios

### Roll Back to a Target Version

The CLI requires a numeric target version. It reverses migrations newer than that version:

```bash
npx msr-firebase down 202501150001
```

To roll back every migration, use the version before the first migration (commonly `0`):

```bash
npx msr-firebase down 0
```

### Restore from a Backup

If migration rollback is not appropriate, restore a backup by its file path:

```bash
npx msr-firebase backup restore ./backups/backup-file.bkp
```

See [Backup & Restore](../writing-migrations/backup-restore) for the effects of restoring full and selective backups.

---

## Inspection and Debugging

### Check Connection and Configuration

```bash
npx msr-firebase firebase:test-connection \
  --database-url "$DATABASE_URL" \
  --credentials "$GOOGLE_APPLICATION_CREDENTIALS"

npx msr-firebase firebase:info
```

### List Root Nodes

```bash
npx msr-firebase firebase:nodes
```

### Back Up Selected Nodes

```bash
npx msr-firebase firebase:backup-nodes users posts settings
```

---

## Migration Locking

### Check Lock Status

```bash
# See if migrations are currently running
npx msr-firebase lock:status
```

**Locked output:**
```
🔒 Lock Status: LOCKED

   Runner ID:  web-server-1-12345-a1b2c3d4
   Acquired At:  2024-01-15T10:30:00.000Z
   Expires At:   2024-01-15T10:40:00.000Z
   Process ID:   12345
```

**Unlocked output:**
```
🔓 Lock Status: UNLOCKED

   No active migration lock
```

### Force Release Stuck Lock

```bash
# WARNING: Only use when certain no migration is running
npx msr-firebase lock:release --force
```

**Safety checklist:**
1. Check lock status shows lock is stuck
2. Verify process holding lock has terminated
3. Confirm no migrations are running
4. Consider waiting for lock to expire naturally

---

## Scripting and Automation

### Migration Status Check

```bash
#!/bin/bash

# Check for pending migrations
PENDING=$(npx msr-firebase list --format json | jq -s '[.[] | .pending[]?] | length')

if [ "$PENDING" -gt 0 ]; then
  echo "⚠️  $PENDING pending migrations found"
  npx msr-firebase list
else
  echo "✓ All migrations applied"
fi
```

### Safe Production Deploy

```bash
#!/bin/bash
set -e

echo "🔍 Validating migrations..."
npx msr-firebase validate

echo "💾 Creating backup..."
# Configure backupMode=full on the migration command to create and restore backups automatically.

echo "🚀 Running migrations..."
if npx msr-firebase migrate \
  --database-url "$PROD_DATABASE_URL" \
  --credentials ./prod-key.json \
  --backup-mode full; then
  echo "✓ Migrations successful"
else
  echo "✗ Migrations failed; Core attempted restoration according to backupMode."
  exit 1
fi
```

### Parallel Environment Migrations

```bash
#!/bin/bash

ENVIRONMENTS=("development" "staging")

for env in "${ENVIRONMENTS[@]}"; do
  echo "Migrating $env..."
  npx msr-firebase migrate \
    --database-url "https://SHARED-DATABASE.REGION.firebasedatabase.app" \
    --credentials ./key.json \
    --shift "$env" &
done

wait
echo "All environments migrated"
```

---

## Output Formats

### Table Format (Default)

```bash
npx msr-firebase list
```

The renderer prints separate tables for available groups: `Migrated` (timestamp, name, execution time, duration, username, and local-file status), `Pending` (timestamp, name, and path), and `Ignored Scripts` (timestamp, name, and path). Empty groups are omitted.

### JSON Format

```bash
npx msr-firebase list --format json
```

The JSON renderer writes separate grouped objects for available categories such as `banner`, `migrated`, `pending`, and `ignored`; it does not return one flat array with status fields. For example, it may write:

```json
{
  "migrated": [
    {
      "timestamp": 202501220100,
      "name": "V202501220100_create_users.ts",
      "executed": "2025-01-22T10:00:00.000Z",
      "duration": 2.5,
      "foundLocally": true
    }
  ]
}
```

```json
{
  "pending": [
    {
      "timestamp": 202501220200,
      "name": "V202501220200_add_email.ts",
      "path": "./migrations/V202501220200_add_email.ts"
    }
  ]
}
```

Use `jq -s` to process those separate JSON objects:

```bash
PENDING=$(npx msr-firebase list --format json | jq -s '[.[] | .pending[]?] | length')
echo "Pending migrations: $PENDING"
```

---

## Configuration Reference

For logger, log-level, format, and config-file options, see [Configuration](configuration). For complete pipeline examples, see [CI/CD Integration](ci-cd).

---

## See Also

- **[Commands](commands)** - Complete command reference
- **[Configuration](configuration)** - CLI flags and options
- **[CI/CD Integration](ci-cd)** - Pipeline examples
