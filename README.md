# Firebase Migration Script Runner

[![Build Status](https://app.travis-ci.com/vlavrynovych/msr-firebase.svg?branch=master)](https://app.travis-ci.com/vlavrynovych/msr-firebase)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/vlavrynovych/msr-firebase/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/vlavrynovych/msr-firebase/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/vlavrynovych/msr-firebase/badge.svg?branch=master)](https://coveralls.io/github/vlavrynovych/msr-firebase?branch=master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vlavrynovych_msr-firebase&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr-firebase)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=vlavrynovych_msr-firebase&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr-firebase)
[![GitHub issues](https://img.shields.io/github/issues/vlavrynovych/msr-firebase.svg)](https://github.com/vlavrynovych/msr-firebase/issues)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20CC%20%2B%20Attribution-blue.svg)](https://raw.githubusercontent.com/migration-script-runner/msr-firebase/master/LICENSE)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
![Static Badge](https://img.shields.io/badge/in%20Ukraine-dodgerblue?label=Proudly%20made&labelColor=%23FFFF00)

[//]: # ([![NPM]&#40;https://nodei.co/npm/msr-firebase.png?downloads=true&#41;]&#40;https://nodei.co/npm/msr-firebase/&#41;)
[//]: # ([![SonarCloud]&#40;https://sonarcloud.io/images/project_badges/sonarcloud-white.svg&#41;]&#40;https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr-firebase&#41;)

[npm-image]: https://img.shields.io/npm/v/msr-firebase.svg?style=flat
[npm-url]: https://npmjs.org/package/msr-firebase
[npm-downloads-image]: https://img.shields.io/npm/dm/msr-firebase.svg?style=flat

Firebase Realtime Database adapter for [Migration Script Runner (MSR Core)](https://github.com/migration-script-runner/msr-core). Provides version-controlled database migrations with built-in backup, rollback, and distributed locking for production deployments.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Documentation](#documentation)

## Features

- 🔄 **Version-Controlled Migrations**: Track and apply database changes systematically
- 🔒 **Distributed Locking**: Prevent concurrent migrations in Kubernetes, Docker, and multi-instance deployments
- 💾 **Automatic Backups**: Built-in backup and restore functionality
- ↩️ **Rollback Support**: Safely revert migrations with `down()` functions or backups
- ✅ **Checksum Validation**: Detect modified migration files
- 🎯 **Firebase-Specific**: Optimized for Firebase Realtime Database with atomic transactions
- 🛠️ **CLI & Programmatic**: Use via command-line or integrate into your application
- 🧪 **Emulator Support**: Test migrations locally with Firebase Emulator
- 📊 **Migration Status**: Track applied, pending, and failed migrations
- 🔐 **Production-Ready**: Battle-tested locking for distributed environments

## Installation

```bash
npm install @migration-script-runner/firebase
```

Or with yarn:
```bash
yarn add @migration-script-runner/firebase
```

## Quick Start

### 1. Create a migration

```bash
npx msr-firebase create add-users-table
```

### 2. Write your migration

```typescript
// migrations/1234567890-add-users-table.ts
import { IMigrationScript } from '@migration-script-runner/core';
import * as admin from 'firebase-admin';

export const up: IMigrationScript<admin.database.Database>['up'] = async (db) => {
  await db.ref('users').set({
    user1: { name: 'Alice', email: 'alice@example.com' }
  });
};

export const down: IMigrationScript<admin.database.Database>['down'] = async (db) => {
  await db.ref('users').remove();
};
```

### 3. Configure Firebase

```javascript
// msr.config.js
module.exports = {
  folder: './migrations',
  tableName: 'schema_version',
  locking: {
    enabled: process.env.NODE_ENV === 'production',
    timeout: 600000  // 10 minutes
  }
};
```

### 4. Run migrations

```bash
# Set environment variables
export FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Apply all pending migrations
npx msr-firebase migrate
```

## Key Features

### 🔒 Migration Locking for Distributed Environments

Perfect for Kubernetes, Docker Swarm, and auto-scaling deployments:

```javascript
// msr.config.js
module.exports = {
  locking: {
    enabled: true,
    timeout: 600000  // 10 minutes
  }
};
```

**Benefits:**
- Prevents race conditions in multi-pod deployments
- Automatic lock expiration and cleanup
- Force-release stuck locks with CLI commands
- Works seamlessly across distributed instances

**CLI Commands:**
```bash
# Check lock status
msr-firebase lock:status

# Force-release stuck lock
msr-firebase lock:release --force
```

See [Migration Locking Guide](https://migration-script-runner.github.io/msr-firebase/guides/migration-locking) for details.

### 💾 Backup & Restore

Automatic backups before migrations:

```bash
# Create backup
msr-firebase backup

# List backups
msr-firebase list-backups

# Restore from backup
msr-firebase restore backup-1234567890.json
```

### ↩️ Safe Rollbacks

Multiple rollback strategies:

```bash
# Roll back last migration
msr-firebase down

# Roll back multiple migrations
msr-firebase down --steps 3
```

### 🧪 Firebase Emulator Support

Test migrations locally before deploying:

```bash
# Start emulator
firebase emulators:start --only database

# Run migrations against emulator
export FIREBASE_DATABASE_URL=http://localhost:9000
msr-firebase migrate
```

## Documentation

Full documentation available at [https://migration-script-runner.github.io/msr-firebase/](https://migration-script-runner.github.io/msr-firebase/)

### Quick Links

- [Getting Started](https://migration-script-runner.github.io/msr-firebase/getting-started)
- [Writing Migrations](https://migration-script-runner.github.io/msr-firebase/guides/writing-migrations)
- [Migration Locking](https://migration-script-runner.github.io/msr-firebase/guides/migration-locking)
- [Configuration](https://migration-script-runner.github.io/msr-firebase/guides/configuration)
- [CLI Usage](https://migration-script-runner.github.io/msr-firebase/guides/cli-usage)
- [API Reference](https://migration-script-runner.github.io/msr-firebase/api/)
- [Examples](https://migration-script-runner.github.io/msr-firebase/examples/)

## How to obtain Service Account Key

Firebase Documentation: https://firebase.google.com/docs/admin/setup

Steps:
1. Open
`https://console.firebase.google.com/project/{your_project_id}/settings/serviceaccounts/adminsdk` link,
    where {your_project_id} should be replaced
2. Click **Generate new private key** button and download your private key as a JSON file

---

## 📄 License

This project is licensed under the **MIT License with Commons Clause and Attribution Requirements**.

Based on [Migration Script Runner](https://github.com/migration-script-runner/msr-core) by Volodymyr Lavrynovych.

**Quick Summary:**
- ✅ Free to use in your applications (including commercial)
- ✅ Free to modify and contribute
- ❌ Cannot sell this adapter or Firebase-specific extensions as standalone products
- 🔒 Firebase migration extensions require attribution

See the [LICENSE](LICENSE) file and [NOTICE](NOTICE) file for detailed examples and FAQ.

---

**By [Volodymyr Lavrynovych](https://github.com/vlavrynovych)** • Created in Ukraine 🇺🇦
