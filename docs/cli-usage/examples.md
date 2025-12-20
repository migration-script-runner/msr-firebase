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
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

### Using Environment Variables

```bash
# Set environment variables
export DATABASE_URL=https://your-project.firebaseio.com
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
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json

# 2. List pending migrations
npx msr-firebase list

# 3. Validate migration files
npx msr-firebase validate

# 4. Run migrations
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json
```

### Safe Migration with Backup

Create backup before risky migrations:

```bash
# 1. Create backup
npx msr-firebase backup

# 2. Run migration with full backup mode
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json \
  --backup-mode full

# 3. If something goes wrong, restore from backup
npx msr-firebase restore backup-1234567890.json
```

### Dry Run First

Preview changes without applying:

```bash
# Dry run to see what would happen
npx msr-firebase migrate --dry-run \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json

# If satisfied, run for real
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
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
  --database-url https://prod-project.firebaseio.com \
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
  --database-url https://shared-db.firebaseio.com \
  --credentials ./key.json \
  --shift development

# Staging environment
npx msr-firebase migrate \
  --database-url https://shared-db.firebaseio.com \
  --credentials ./key.json \
  --shift staging

# Production environment
npx msr-firebase migrate \
  --database-url https://shared-db.firebaseio.com \
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

### Rollback Last Migration

```bash
# Check current state
npx msr-firebase list

# Rollback last migration
npx msr-firebase down
```

### Rollback to Specific Version

```bash
# Rollback to specific timestamp
npx msr-firebase down 202501150001

# Or rollback multiple steps
npx msr-firebase down --steps 3
```

### Rollback with Backup Restore

```bash
# If down() fails, restore from backup
npx msr-firebase restore backup-1234567890.json
```

---

## Inspection and Debugging

### Check Connection

```bash
# Test database connection
npx msr-firebase firebase:test-connection \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json
```

### View Connection Info

```bash
# Show current configuration
npx msr-firebase firebase:info
```

**Output:**
```
📊 Firebase Connection Information:

  Database URL: https://your-project.firebaseio.com
  Shift Path:   /production
  Table Name:   schema_version
```

### List Root Nodes

```bash
# See all root nodes in database
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

### Backup Specific Nodes

```bash
# Backup specific nodes before operation
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

   Executor ID:  web-server-1-12345-a1b2c3d4
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
PENDING=$(npx msr-firebase list --format json | jq '[.[] | select(.status == "pending")] | length')

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
BACKUP=$(npx msr-firebase backup --format json | jq -r '.backupId')

echo "🚀 Running migrations..."
if npx msr-firebase migrate \
  --database-url "$PROD_DATABASE_URL" \
  --credentials ./prod-key.json \
  --backup-mode full; then
  echo "✓ Migrations successful"
else
  echo "✗ Migrations failed, restoring backup..."
  npx msr-firebase restore "$BACKUP"
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
    --database-url "https://shared-db.firebaseio.com" \
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

**Output:**
```
┌─────────────┬──────────────────────┬──────────┬─────────────────────┐
│ Timestamp   │ Name                 │ Status   │ Applied At          │
├─────────────┼──────────────────────┼──────────┼─────────────────────┤
│ 1234567890  │ create-users         │ applied  │ 2024-01-15 10:30:00 │
│ 1234567891  │ add-email-index      │ pending  │ -                   │
└─────────────┴──────────────────────┴──────────┴─────────────────────┘
```

### JSON Format

```bash
npx msr-firebase list --format json
```

**Output:**
```json
[
  {
    "timestamp": "1234567890",
    "name": "create-users",
    "status": "applied",
    "appliedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "timestamp": "1234567891",
    "name": "add-email-index",
    "status": "pending",
    "appliedAt": null
  }
]
```

**Use case:** Parsing output in scripts
```bash
# Count pending migrations
PENDING=$(npx msr-firebase list --format json | jq '[.[] | select(.status == "pending")] | length')
echo "Pending migrations: $PENDING"
```

---

## Logging Options

### Debug Logging

```bash
# Detailed debug output
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json \
  --log-level debug
```

### Log to File

```bash
# Write logs to file
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json \
  --logger file \
  --log-file ./logs/migration.log
```

### Silent Mode

```bash
# No console output (for cron jobs)
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./key.json \
  --logger silent
```

---

## Config Files

### Basic Config

Create `msr.config.js`:

```javascript
module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  applicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  folder: './migrations',
  tableName: 'schema_version'
};
```

**Usage:**
```bash
npx msr-firebase migrate --config-file ./msr.config.js
```

### Environment-Specific Configs

**Development:**
```javascript
// msr.config.dev.js
module.exports = {
  databaseUrl: 'http://localhost:9000?ns=my-project-dev',
  applicationCredentials: './dev-key.json',
  shift: 'development',
  backupMode: 'manual'
};
```

**Production:**
```javascript
// msr.config.prod.js
module.exports = {
  databaseUrl: process.env.PROD_DATABASE_URL,
  applicationCredentials: process.env.PROD_CREDENTIALS,
  shift: 'production',
  backupMode: 'full',
  locking: {
    enabled: true,
    timeout: 600000
  }
};
```

**Usage:**
```bash
# Development
npx msr-firebase migrate --config-file ./msr.config.dev.js

# Production
npx msr-firebase migrate --config-file ./msr.config.prod.js
```

---

## Exit Codes

Use exit codes for CI/CD automation:

```bash
#!/bin/bash

npx msr-firebase migrate
EXIT_CODE=$?

case $EXIT_CODE in
  0)
    echo "✓ Migrations successful"
    ;;
  1)
    echo "✗ General error"
    exit 1
    ;;
  2)
    echo "✗ Configuration error"
    exit 2
    ;;
  3)
    echo "✗ Migration error"
    exit 3
    ;;
  4)
    echo "✗ Validation error"
    exit 4
    ;;
  7)
    echo "✗ Database connection error"
    exit 7
    ;;
  *)
    echo "✗ Unknown error: $EXIT_CODE"
    exit $EXIT_CODE
    ;;
esac
```

---

## See Also

- **[Commands](commands)** - Complete command reference
- **[Configuration](configuration)** - CLI flags and options
- **[CI/CD Integration](ci-cd)** - Pipeline examples
