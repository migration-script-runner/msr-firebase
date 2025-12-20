# Firebase Migration Script Runner

[![Test](https://github.com/migration-script-runner/msr-firebase/actions/workflows/test.yml/badge.svg)](https://github.com/migration-script-runner/msr-firebase/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/migration-script-runner/msr-firebase/badge.svg?branch=master)](https://coveralls.io/github/migration-script-runner/msr-firebase?branch=master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vlavrynovych_msr-firebase&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr-firebase)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![GitHub issues](https://img.shields.io/github/issues/migration-script-runner/msr-firebase.svg)](https://github.com/migration-script-runner/msr-firebase/issues)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20CC%20%2B%20Attribution-blue.svg)](https://raw.githubusercontent.com/migration-script-runner/msr-firebase/master/LICENSE)
![Static Badge](https://img.shields.io/badge/in%20Ukraine-dodgerblue?label=Proudly%20made&labelColor=%23FFFF00)

[//]: # ([![NPM]&#40;https://nodei.co/npm/msr-firebase.png?downloads=true&#41;]&#40;https://nodei.co/npm/msr-firebase/&#41;)
[//]: # ([![SonarCloud]&#40;https://sonarcloud.io/images/project_badges/sonarcloud-white.svg&#41;]&#40;https://sonarcloud.io/summary/new_code?id=vlavrynovych_msr-firebase&#41;)

[npm-image]: https://img.shields.io/npm/v/@migration-script-runner/firebase.svg?style=flat
[npm-url]: https://npmjs.org/package/@migration-script-runner/firebase
[npm-downloads-image]: https://img.shields.io/npm/dm/@migration-script-runner/firebase.svg?style=flat

Firebase Realtime Database implementation for [Migration Script Runner (MSR Core)](https://github.com/migration-script-runner/msr-core). Provides version-controlled database migrations with built-in backup, rollback, and distributed locking for production deployments.

## What's New in v0.2.0

🎉 Major upgrade with production-ready features:

- 🔒 **Migration Locking** - Prevent concurrent migrations in Kubernetes, Docker, and multi-instance deployments
- ⬆️ **MSR Core v0.8.1** - Latest core with bug fixes, handler access API, and improved locking lifecycle
- 🔧 **Type-Safe API** - Full TypeScript support with generic type parameters
- 🖥️ **Lock Management CLI** - Commands for monitoring and managing migration locks
- 📚 **Comprehensive Documentation** - 300+ line locking guide with deployment examples
- 🧪 **Production Tested** - Battle-tested in distributed environments

**Upgrading from v0.1.x?** See the [Migration Guide](https://migration-script-runner.github.io/msr-firebase/version-migration/v0.1-to-v0.2).

## Table of Contents
- [What's New in v0.2.0](#whats-new-in-v020)
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

```bash
# Install
npm install @migration-script-runner/firebase

# Run migrations with inline credentials
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json

# Or use environment variables
export DATABASE_URL=https://your-project.firebaseio.com
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npx msr-firebase migrate
```

**👉 [View Full Getting Started Guide](https://migration-script-runner.github.io/msr-firebase/getting-started)** for complete setup instructions, migration examples, and configuration options.

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

See [Migration Locking Guide](https://migration-script-runner.github.io/msr-firebase/writing-migrations/migration-locking) for details.

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

**Getting Started:**
- [Getting Started](https://migration-script-runner.github.io/msr-firebase/getting-started) - Installation and quick start

**Using MSR Firebase:**
- [CLI Usage](https://migration-script-runner.github.io/msr-firebase/cli-usage/) - Command-line interface guide
- [Library Usage](https://migration-script-runner.github.io/msr-firebase/library-usage/) - Programmatic API usage
- [API Reference](https://migration-script-runner.github.io/msr-firebase/api/) - Complete API documentation

**Writing Migrations:**
- [Migration Scripts](https://migration-script-runner.github.io/msr-firebase/writing-migrations/migration-scripts) - How to write migrations
- [Migration Locking](https://migration-script-runner.github.io/msr-firebase/writing-migrations/migration-locking) - Distributed environments
- [Transactions](https://migration-script-runner.github.io/msr-firebase/writing-migrations/transactions) - Firebase transaction limitations
- [Testing](https://migration-script-runner.github.io/msr-firebase/writing-migrations/testing) - Testing with Firebase Emulator
- [Backup & Restore](https://migration-script-runner.github.io/msr-firebase/writing-migrations/backup-restore) - Backup strategies

## How to obtain Service Account Key

To use the Firebase Admin SDK in non-Google environments, you need a service account key file.

**Official Documentation:** [Initialize the SDK in non-Google environments](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments)

**Quick Steps:**
1. Open `https://console.firebase.google.com/project/{your_project_id}/settings/serviceaccounts/adminsdk`
   (replace `{your_project_id}` with your actual project ID)
2. Click **Generate new private key** button
3. Download the JSON file and store it securely
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the file path

---

## Migration from v0.1.x

**Breaking Change:** Package name changed from `msr-firebase` to `@migration-script-runner/firebase`.

For complete upgrade instructions, troubleshooting, and migration scenarios, see the [**Migration Guide**](https://migration-script-runner.github.io/msr-firebase/version-migration/v0.1-to-v0.2).

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
