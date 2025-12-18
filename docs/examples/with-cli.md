---
layout: default
title: CLI Examples
parent: Examples
nav_order: 2
---

# CLI Examples
{: .no_toc }

Practical examples using the `msr-firebase` CLI.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Basic CLI Usage

### Install and Setup

```bash
# Install globally
npm install -g @migration-script-runner/firebase

# Or use with npx
npx msr-firebase --version
```

### Environment Setup

Create `.env` file:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
MIGRATIONS_PATH=./migrations
```

### Run Migrations

```bash
msr-firebase migrate
```

**Output:**
```
MSR Firebase v0.1.0

Running migrations...
✓ 001-create-users (1234567890)
✓ 002-add-posts (1234567891)
✓ 003-create-indexes (1234567892)

Successfully applied 3 migrations
```

## Common Workflows

### Workflow 1: Check Status Before Migrating

```bash
# List current migration status
msr-firebase list

# Validate migrations
msr-firebase validate

# Apply migrations
msr-firebase migrate
```

### Workflow 2: Safe Migration with Backup

```bash
# Create backup first
msr-firebase backup

# Apply migrations
msr-firebase migrate

# If something went wrong, restore
# msr-firebase restore backup-1234567890.json
```

### Workflow 3: Dry Run Before Production

```bash
# Test migrations without applying
msr-firebase migrate --dry-run

# If OK, apply for real
msr-firebase migrate
```

## List Migrations

### View All Migrations

```bash
msr-firebase list
```

**Sample Output:**
```
┌─────────────┬──────────────────────┬──────────┬─────────────────────┐
│ Timestamp   │ Name                 │ Status   │ Applied At          │
├─────────────┼──────────────────────┼──────────┼─────────────────────┤
│ 1234567890  │ create-users         │ applied  │ 2024-01-15 10:30:00 │
│ 1234567891  │ add-email-index      │ applied  │ 2024-01-15 10:31:15 │
│ 1234567892  │ migrate-profiles     │ pending  │ -                   │
│ 1234567893  │ add-timestamps       │ pending  │ -                   │
└─────────────┴──────────────────────┴──────────┴─────────────────────┘

Summary: 2 applied, 2 pending
```

### Filter Output

```bash
# Show only pending migrations
msr-firebase list | grep pending

# Show only applied migrations
msr-firebase list | grep applied
```

## Validation

### Validate All Migrations

```bash
msr-firebase validate
```

**Success Output:**
```
Validating migrations...

✓ No duplicate timestamps
✓ All applied migrations exist
✓ Checksums valid
✓ No format errors

Validation passed!
```

**Error Output:**
```
Validating migrations...

✗ Duplicate timestamp found: 1234567890
  - migrations/1234567890-create-users.ts
  - migrations/1234567890-add-posts.ts

✗ Checksum mismatch for: 002-add-posts
  Expected: abc123
  Got: def456

⚠ Missing down() function in: 003-create-indexes

Validation failed with 2 errors and 1 warning
```

## Rollback Operations

### Roll Back Last Migration

```bash
msr-firebase down
```

**Output:**
```
Rolling back migrations...
✓ Rolled back: 003-create-indexes (1234567892)

Successfully rolled back 1 migration
```

### Roll Back Multiple Migrations

```bash
# Roll back last 3 migrations
msr-firebase down --steps 3
```

**Output:**
```
Rolling back migrations...
✓ Rolled back: 003-create-indexes (1234567892)
✓ Rolled back: 002-add-email-index (1234567891)
✓ Rolled back: 001-create-users (1234567890)

Successfully rolled back 3 migrations
```

### Roll Back to Specific Version

```bash
# Roll back to timestamp 1234567890
msr-firebase down --to 1234567890
```

## Backup and Restore

### Create Backup

```bash
msr-firebase backup
```

**Output:**
```
Creating backup of database...

✓ Backup created successfully

Backup ID: backup-1234567890.json
Location: ./backups/backup-1234567890.json
Size: 2.5 MB
Created: 2024-01-15 10:30:00
```

### List Backups

```bash
ls -lh backups/
```

**Output:**
```
-rw-r--r-- 1 user staff 2.5M Jan 15 10:30 backup-1234567890.json
-rw-r--r-- 1 user staff 2.4M Jan 14 09:15 backup-1234567789.json
-rw-r--r-- 1 user staff 2.3M Jan 13 08:00 backup-1234567688.json
```

### Restore from Backup

```bash
msr-firebase restore backup-1234567890.json
```

**Output with Confirmation:**
```
⚠️  WARNING: This will overwrite all data in the database!

Database: https://your-project.firebaseio.com
Backup: backup-1234567890.json
Created: 2024-01-15 10:30:00
Size: 2.5 MB

Are you sure you want to continue? (y/N): y

Restoring backup...
✓ Database restored successfully
```

## Advanced Usage

### Custom Configuration

```bash
# Use custom config file
msr-firebase migrate --config ./config/production.env

# Use custom migrations directory
msr-firebase migrate --migrations-path ./db/migrations

# Combine options
msr-firebase migrate \
  --config ./config/production.env \
  --migrations-path ./db/migrations \
  --verbose
```

### Verbose Output

```bash
msr-firebase migrate --verbose
```

**Output:**
```
MSR Firebase v0.1.0

Configuration:
  Database: https://your-project.firebaseio.com
  Migrations: ./migrations
  Rollback: backup
  Validate checksums: true

Loading migrations...
  Found 3 migration files

Connecting to database...
  Connected to https://your-project.firebaseio.com

Checking applied migrations...
  Found 2 applied migrations

Running migrations...
  Applying: 003-create-indexes (1234567892)
    ✓ Migration completed (1.2s)

Successfully applied 1 migration
Total time: 2.5s
```

### Silent Mode

```bash
msr-firebase migrate --silent
echo $?  # Check exit code: 0 = success, non-zero = failure
```

## Shell Scripts

### Automated Migration Script

```bash
#!/bin/bash
set -e

echo "Starting migration process..."

# Load environment
source .env

# Validate before migrating
echo "Validating migrations..."
if ! msr-firebase validate; then
  echo "Validation failed!"
  exit 1
fi

# Create backup
echo "Creating backup..."
BACKUP_ID=$(msr-firebase backup | grep "Backup ID:" | awk '{print $3}')
echo "Backup created: $BACKUP_ID"

# Run migrations
echo "Running migrations..."
if msr-firebase migrate; then
  echo "✓ Migrations successful"
  exit 0
else
  echo "✗ Migrations failed, restoring backup..."
  msr-firebase restore "$BACKUP_ID"
  exit 1
fi
```

### Conditional Migration

```bash
#!/bin/bash

# Only migrate if there are pending migrations
PENDING=$(msr-firebase list | grep pending | wc -l)

if [ "$PENDING" -gt 0 ]; then
  echo "Found $PENDING pending migrations"
  msr-firebase migrate
else
  echo "No pending migrations"
fi
```

## CI/CD Examples

### GitHub Actions

```yaml
name: Database Migrations

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate migrations
        run: npx msr-firebase validate
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
          FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}

      - name: Run migrations
        run: npx msr-firebase migrate
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
          FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
```

### Docker Container

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install MSR Firebase globally
RUN npm install -g @migration-script-runner/firebase

# Copy migrations
COPY migrations ./migrations

# Copy environment
COPY .env .env

CMD ["msr-firebase", "migrate"]
```

Run container:
```bash
docker build -t my-migrations .
docker run --env-file .env my-migrations
```

## See Also

- [Basic Usage](basic-usage) - API examples
- [Custom Commands](custom-commands) - Extending CLI
- [CLI Guide](../guides/cli-usage) - Complete CLI reference
