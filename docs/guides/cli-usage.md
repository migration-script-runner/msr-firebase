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

The CLI reads configuration from three sources (in order of priority):

1. **CLI Flags** (highest priority) - Command-line arguments
2. **Environment Variables** - `.env` file or shell variables
3. **Config File** - `msr.config.js` or specified with `--config-file`

### CLI Flags (v0.8.3+)

The easiest way to get started is using CLI flags:

```bash
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

**Firebase-specific flags:**
- `--database-url <url>` - Firebase Realtime Database URL
- `--credentials <path>` - Path to service account key JSON file

**Standard MSR flags:**
- `--folder <path>` - Migrations folder (default: `./migrations`)
- `--table-name <name>` - Schema version table name (default: `schema_version`)
- `--config-file <path>` - Load config from file
- `--dry-run` - Simulate without executing
- `--no-lock` - Disable migration locking
- `--format <format>` - Output format: `table` or `json`

### Environment Variables

Alternatively, use environment variables in `.env` file:

```bash
DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
MSR_FOLDER=./migrations
MSR_TABLE_NAME=schema_version
```

{: .note }
**Configuration Priority:** CLI flags override environment variables, which override config files. This allows flexible configuration per environment.

## Commands

### migrate

Apply pending migrations.

```bash
msr-firebase migrate [targetVersion] [options]
```

**Options:**
- `--database-url <url>` - Firebase Database URL
- `--credentials <path>` - Service account key file path
- `--dry-run` - Simulate migration without applying changes
- `--no-lock` - Disable migration locking for this run
- `--folder <path>` - Custom migrations folder

**Examples:**
```bash
# Apply all pending migrations with inline credentials
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json

# Apply using environment variables
npx msr-firebase migrate

# Dry run to preview changes
npx msr-firebase migrate --dry-run

# Migrate to specific version
npx msr-firebase migrate 1234567890

# Custom migrations folder
npx msr-firebase migrate --folder ./db/migrations
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

**Firebase-specific:**
- `--database-url <url>` - Firebase Realtime Database URL
- `--credentials <path>` - Path to service account key JSON file

**Standard MSR Core:**
- `--config-file <path>` - Path to config file
- `--folder <path>` - Override migrations directory
- `--table-name <name>` - Schema version table name
- `--display-limit <number>` - Maximum migrations to display
- `--dry-run` - Simulate without executing
- `--no-lock` - Disable migration locking
- `--logger <type>` - Logger type: `console`, `file`, or `silent`
- `--log-level <level>` - Log level: `error`, `warn`, `info`, `debug`
- `--log-file <path>` - Log file path (with `--logger file`)
- `--format <format>` - Output format: `table` or `json`
- `-h, --help` - Show command help
- `-V, --version` - Show version number

**Examples:**
```bash
# Use CLI flags for credentials
npx msr-firebase migrate \
  --database-url https://prod.firebaseio.com \
  --credentials ./prod-key.json

# Use custom config file
npx msr-firebase migrate --config-file ./msr.config.js

# Custom migrations path
npx msr-firebase list --folder ./db/migrations

# JSON output for scripting
npx msr-firebase list --format json
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

**Option 1: Using CLI Flags (Recommended)**

Store service account key as a secret and use CLI flags:

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

      - name: Create service account key file
        run: echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}' > key.json

      - name: Run migrations
        run: |
          npx msr-firebase migrate \
            --database-url ${{ secrets.FIREBASE_DATABASE_URL }} \
            --credentials ./key.json

      - name: Cleanup
        if: always()
        run: rm -f key.json
```

**Option 2: Using Environment Variables**

```yaml
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
          GOOGLE_APPLICATION_CREDENTIALS: ./key.json
        run: npx msr-firebase migrate
```

### GitLab CI

```yaml
migrate:
  stage: deploy
  image: node:18
  before_script:
    - npm ci
    - echo "$FIREBASE_SERVICE_ACCOUNT_KEY" > key.json
  script:
    - npx msr-firebase migrate
        --database-url $FIREBASE_DATABASE_URL
        --credentials ./key.json
  after_script:
    - rm -f key.json
  only:
    - main
```

### Docker

**Using CLI flags:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY migrations ./migrations
COPY serviceAccountKey.json ./key.json

# Pass credentials via CLI flags
CMD ["npx", "msr-firebase", "migrate", \
     "--database-url", "${DATABASE_URL}", \
     "--credentials", "./key.json"]
```

**Using environment variables:**

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

### Development (Local Firebase Emulator)

**Using CLI flags:**
```bash
npx msr-firebase migrate \
  --database-url http://localhost:9000 \
  --credentials ./dev-key.json \
  --folder ./migrations
```

**Using .env file:**
```bash
# .env.development
DATABASE_URL=http://localhost:9000?ns=my-project-dev
GOOGLE_APPLICATION_CREDENTIALS=./dev-key.json
```

### Production

**Using CLI flags:**
```bash
npx msr-firebase migrate \
  --database-url https://prod-project.firebaseio.com \
  --credentials ./prod-key.json \
  --no-lock false
```

**Using .env file:**
```bash
# .env.production
DATABASE_URL=https://prod-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./prod-key.json
```

**Usage with config files:**
```bash
# Development
npx msr-firebase migrate --config-file ./msr.config.dev.js

# Production
npx msr-firebase migrate --config-file ./msr.config.prod.js
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
