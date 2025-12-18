---
layout: default
title: CLI Usage
parent: Guides
nav_order: 3
---

# CLI Usage
{: .no_toc }

Complete guide to using the `msr-firebase` command-line interface.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Installation

Install globally:
```bash
npm install -g @migration-script-runner/firebase
```

Or use with npx:
```bash
npx msr-firebase <command>
```

## Configuration

The CLI reads configuration from environment variables or a `.env` file:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
MIGRATIONS_PATH=./migrations
```

## Commands

### migrate

Apply pending migrations.

```bash
msr-firebase migrate
```

**Options:**
- `--dry-run` - Simulate migration without applying changes
- `--to <timestamp>` - Migrate up to specific timestamp

**Examples:**
```bash
# Apply all pending migrations
msr-firebase migrate

# Dry run
msr-firebase migrate --dry-run

# Migrate to specific version
msr-firebase migrate --to 1234567890
```

### down

Roll back migrations.

```bash
msr-firebase down [options]
```

**Options:**
- `--steps <n>` - Number of migrations to roll back
- `--to <timestamp>` - Roll back to specific timestamp

**Examples:**
```bash
# Roll back last migration
msr-firebase down

# Roll back last 3 migrations
msr-firebase down --steps 3

# Roll back to specific version
msr-firebase down --to 1234567890
```

### list

List all migrations with their status.

```bash
msr-firebase list
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

### validate

Validate migration files and integrity.

```bash
msr-firebase validate
```

**Checks:**
- Duplicate timestamps
- Missing files
- Checksum integrity
- File format errors

**Example output:**
```
✓ No duplicate timestamps found
✓ All applied migrations have files
✓ Checksums match
✓ All migrations valid

Validation passed!
```

### backup

Create a backup of the database.

```bash
msr-firebase backup
```

**Example:**
```bash
msr-firebase backup

# Output:
# Backup created: backup-1234567890.json
# Location: ./backups/backup-1234567890.json
```

### restore

Restore database from a backup.

```bash
msr-firebase restore <backup-id>
```

**Example:**
```bash
msr-firebase restore backup-1234567890.json
```

{: .warning }
> Restore will overwrite existing data. Use with caution!

### lock:status

Display current migration lock status.

```bash
msr-firebase lock:status
```

**Example output (locked):**
```
🔒 Lock Status: LOCKED

   Executor ID:  web-server-1-12345-a1b2c3d4
   Acquired At:  2024-01-15T10:30:00.000Z
   Expires At:   2024-01-15T10:40:00.000Z
   Process ID:   12345
```

**Example output (unlocked):**
```
🔓 Lock Status: UNLOCKED

   No active migration lock
```

**Use cases:**
- Check if migrations are currently running
- Verify lock expiration time
- Identify which process holds the lock

### lock:release

Force-release a stuck migration lock.

```bash
msr-firebase lock:release --force
```

**Example output:**
```
⚠️  Warning: Force-releasing migration lock

   Locked by:    web-server-1-12345-a1b2c3d4
   Acquired at:  2024-01-15T10:30:00.000Z

✅ Lock released successfully
```

{: .warning }
> **DANGER**: Only use `--force` when certain no migration is running. Releasing an active lock can cause data corruption.

**When to use:**
- Process holding lock has crashed
- Lock has been held beyond reasonable time
- After verifying no migrations are running

**Safety checklist before force-releasing:**
1. ✅ Check `lock:status` shows lock is stuck
2. ✅ Verify process holding lock has terminated (check logs, process list)
3. ✅ Confirm no migrations are running
4. ✅ Consider waiting for lock to expire naturally

**See:** [Migration Locking Guide](migration-locking) for detailed information.

## Global Options

Available for all commands:

- `--config <path>` - Path to config file
- `--migrations-path <path>` - Override migrations directory
- `--verbose` - Enable verbose logging
- `--silent` - Suppress all output
- `--help` - Show command help

**Examples:**
```bash
# Use custom config
msr-firebase migrate --config ./config/production.env

# Custom migrations path
msr-firebase list --migrations-path ./db/migrations

# Verbose output
msr-firebase migrate --verbose
```

## Exit Codes

The CLI uses these exit codes:

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Migration error
- `4` - Validation error

**Usage in scripts:**
```bash
#!/bin/bash

msr-firebase migrate
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "Migrations successful"
else
  echo "Migrations failed with code $EXIT_CODE"
  exit $EXIT_CODE
fi
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Run Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
          FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
        run: npx msr-firebase migrate
```

### GitLab CI

```yaml
migrate:
  stage: deploy
  image: node:18
  script:
    - npm ci
    - npx msr-firebase migrate
  only:
    - main
  variables:
    FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID
    FIREBASE_CLIENT_EMAIL: $FIREBASE_CLIENT_EMAIL
    FIREBASE_PRIVATE_KEY: $FIREBASE_PRIVATE_KEY
    FIREBASE_DATABASE_URL: $FIREBASE_DATABASE_URL
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY migrations ./migrations
COPY .env .env

CMD ["npx", "msr-firebase", "migrate"]
```

## Environment-Specific Configuration

### Development

```bash
# .env.development
FIREBASE_DATABASE_URL=http://localhost:9000
MIGRATIONS_PATH=./migrations
```

### Production

```bash
# .env.production
FIREBASE_DATABASE_URL=https://prod-project.firebaseio.com
MIGRATIONS_PATH=./migrations
VALIDATE_CHECKSUMS=true
```

**Usage:**
```bash
# Development
msr-firebase migrate --config .env.development

# Production
msr-firebase migrate --config .env.production
```

## Troubleshooting

### Authentication Errors

```
Error: Firebase authentication failed
```

**Solution:** Verify your service account credentials are correct and have proper permissions.

### Missing Migrations Path

```
Error: Migrations directory not found
```

**Solution:** Ensure the migrations directory exists or specify correct path with `--migrations-path`.

### Permission Denied

```
Error: Permission denied to access database
```

**Solution:** Verify your service account has Database Admin role in Firebase.

## See Also

- [Configuration](configuration) - Detailed configuration options
- [Writing Migrations](writing-migrations) - Creating migration files
- [Testing](testing) - Testing before deployment
