---
layout: default
title: CLI Usage
nav_order: 3
has_children: true
---

# CLI Usage
{: .no_toc }

Complete guide for using MSR Firebase from the command line.
{: .fs-6 .fw-300 }

## Quick Start

Install and run migrations with a single command:

```bash
# Install
npm install @migration-script-runner/firebase

# Run migrations
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

## CLI Sections

### [Commands](commands)
Firebase-specific commands for managing migrations and database operations.

### [Configuration](configuration)
CLI flags and options for configuring MSR Firebase behavior.

### [Examples](examples)
Real-world CLI workflows and usage patterns.

### [CI/CD Integration](ci-cd)
Using MSR Firebase CLI in continuous integration and deployment pipelines.

---

## Common Commands

### Run Migrations

```bash
# With inline credentials
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json

# With environment variables
export DATABASE_URL=https://your-project.firebaseio.com
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npx msr-firebase migrate
```

### Check Status

```bash
# List migrations
npx msr-firebase list

# Show Firebase connection info
npx msr-firebase firebase:info

# Test connection
npx msr-firebase firebase:test-connection
```

### Rollback

```bash
# Rollback last migration
npx msr-firebase down <timestamp>

# Example
npx msr-firebase down 202501150001
```

---

## Inherited Commands

MSR Firebase inherits standard migration commands from MSR Core:

- `migrate` - Run pending migrations
- `list` - List all migrations with status
- `down` - Rollback migrations
- `validate` - Validate migration scripts
- `backup` - Backup operations
- `lock:status` - Check migration lock status
- `lock:release` - Force release migration lock

For detailed documentation of these commands, see [MSR Core CLI Documentation](https://migration-script-runner.github.io/msr-core/guides/cli-usage).
