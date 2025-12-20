---
layout: default
title: Configuration
parent: CLI Usage
nav_order: 2
---

# CLI Configuration
{: .no_toc }

Configure MSR Firebase CLI through flags, environment variables, and config files.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Configuration Priority

Configuration sources are applied in this order (highest to lowest priority):

1. **CLI Flags** - Command-line arguments
2. **Environment Variables** - `.env` file or shell exports
3. **Config File** - `msr.config.js` or via `--config-file`

---

## Firebase-Specific Flags

### --database-url

Firebase Realtime Database URL.

```bash
npx msr-firebase migrate --database-url https://your-project.firebaseio.com
```

**Environment Variable:**
```bash
export DATABASE_URL=https://your-project.firebaseio.com
```

**Config File:**
```javascript
module.exports = {
  databaseUrl: 'https://your-project.firebaseio.com'
};
```

---

### --credentials

Path to Firebase service account key JSON file.

```bash
npx msr-firebase migrate --credentials ./serviceAccountKey.json
```

**Environment Variable:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

**Config File:**
```javascript
module.exports = {
  applicationCredentials: './serviceAccountKey.json'
};
```

---

### --backup-mode

Control backup behavior during migrations.

```bash
npx msr-firebase migrate --backup-mode create_only
```

**Values:**
- `full` - Create backup, restore on error, delete on success (default)
- `create_only` - Create backup but don't restore automatically
- `restore_only` - Don't create backup, restore from existing on error
- `manual` - No automatic backup/restore

**Examples:**

```bash
# No automatic backup (you manage backups manually)
npx msr-firebase migrate --backup-mode manual

# Create backup but use down() for rollback
npx msr-firebase migrate --backup-mode create_only

# Full automatic (default)
npx msr-firebase migrate --backup-mode full
```

**Environment Variable:**
```bash
export MSR_BACKUP_MODE=create_only
```

---

## Standard MSR Flags

MSR Firebase inherits standard flags from MSR Core:

### --folder

Migrations directory.

```bash
npx msr-firebase migrate --folder ./db/migrations
```

**Default:** `./migrations`

**Environment Variable:** `MSR_FOLDER`

---

### --table-name

Migration tracking table name.

```bash
npx msr-firebase migrate --table-name migration_history
```

**Default:** `schema_version`

**Environment Variable:** `MSR_TABLE_NAME`

---

### --config-file

Load configuration from file.

```bash
npx msr-firebase migrate --config-file ./msr.config.prod.js
```

---

### --dry-run

Simulate without executing changes.

```bash
npx msr-firebase migrate --dry-run
```

---

### --no-lock

Disable migration locking.

```bash
npx msr-firebase migrate --no-lock
```

---

### --format

Output format.

```bash
npx msr-firebase list --format json
```

**Values:** `table`, `json`

---

### --logger

Logger type.

```bash
npx msr-firebase migrate --logger file --log-file ./migrations.log
```

**Values:** `console`, `file`, `silent`

---

### --log-level

Logging verbosity.

```bash
npx msr-firebase migrate --log-level debug
```

**Values:** `error`, `warn`, `info`, `debug`

---

## Environment Variables

### Firebase-Specific

```bash
DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### Standard MSR Variables

```bash
MSR_FOLDER=./migrations
MSR_TABLE_NAME=schema_version
MSR_BACKUP_MODE=full
MSR_LOG_LEVEL=info
```

{: .note }
> For complete list of standard environment variables, see [MSR Core Environment Variables](https://migration-script-runner.github.io/msr-core/guides/environment-variables).

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

Usage:
```bash
npx msr-firebase migrate --config-file ./msr.config.js
```

---

### Environment-Specific Configs

**Development:**
```javascript
// msr.config.dev.js
module.exports = {
  databaseUrl: 'http://localhost:9000?ns=my-project-dev',
  applicationCredentials: './dev-key.json',
  shift: 'development'
};
```

**Production:**
```javascript
// msr.config.prod.js
module.exports = {
  databaseUrl: process.env.PROD_DATABASE_URL,
  applicationCredentials: process.env.PROD_CREDENTIALS,
  shift: 'production',
  locking: {
    enabled: true,
    timeout: 600000
  }
};
```

Usage:
```bash
# Development
npx msr-firebase migrate --config-file ./msr.config.dev.js

# Production
npx msr-firebase migrate --config-file ./msr.config.prod.js
```

---

## Complete Example

Combining all configuration methods:

```bash
# .env file
DATABASE_URL=https://staging.firebaseio.com
MSR_FOLDER=./migrations

# Command with overrides
npx msr-firebase migrate \
  --credentials ./staging-key.json \
  --backup-mode create_only \
  --log-level debug
```

**Priority Resolution:**
1. `--credentials ./staging-key.json` (CLI flag - highest)
2. `DATABASE_URL` from `.env` (environment variable)
3. `MSR_FOLDER` from `.env` (environment variable)
4. Other defaults from MSR Core
