<p align="center">
  <img src="https://migration-script-runner.dev/images/msr-logo-color-glass-translucent.png" alt="Migration Script Runner logo" width="180">
</p>

# MSR: Firebase

[🌐 Official Website](https://migration-script-runner.dev/) · [📖 Documentation](https://firebase.migration-script-runner.dev/) · [📦 npm](https://www.npmjs.com/package/@migration-script-runner/firebase) · [💻 GitHub](https://github.com/migration-script-runner/msr-firebase)

[![Test](https://github.com/migration-script-runner/msr-firebase/actions/workflows/test.yml/badge.svg)](https://github.com/migration-script-runner/msr-firebase/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/migration-script-runner/msr-firebase/badge.svg?branch=master)](https://coveralls.io/github/migration-script-runner/msr-firebase?branch=master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=migration-script-runner_msr-firebase&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=migration-script-runner_msr-firebase)
[![npm version](https://img.shields.io/npm/v/@migration-script-runner/firebase.svg)](https://www.npmjs.com/package/@migration-script-runner/firebase)
[![npm downloads](https://img.shields.io/npm/dm/@migration-script-runner/firebase.svg)](https://www.npmjs.com/package/@migration-script-runner/firebase)
[![GitHub issues](https://img.shields.io/github/issues/migration-script-runner/msr-firebase.svg)](https://github.com/migration-script-runner/msr-firebase/issues)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20CC%20%2B%20Attribution-blue.svg)](LICENSE)
![Proudly made in Ukraine](https://img.shields.io/badge/in%20Ukraine-dodgerblue?label=Proudly%20made&labelColor=%23FFFF00)

MSR: Firebase brings version-controlled migrations, backups, rollback, and distributed locking to Firebase Realtime Database. Use it from the command line or integrate it into a Node.js application with [MSR Core](https://github.com/migration-script-runner/msr-core).

## What's New in v1.0.0

MSR Firebase v1.0.0 adopts the MSR Core v1 runner API and updates the adapter for current Node.js releases.

- **Core v1 integration:** `FirebaseRunner`, CLI adapters, and lock records use the runner naming conventions ([#75](https://github.com/migration-script-runner/msr-firebase/issues/75)).
- **Configuration loading:** `FirebaseRunner.getInstance()` can load configuration before initializing the Firebase handler when no explicit config is supplied ([#95](https://github.com/migration-script-runner/msr-firebase/issues/95)).
- **Selective migration backups:** configure `backupPaths` or pass `--backup-paths`; omit it to keep full-database backups ([#87](https://github.com/migration-script-runner/msr-firebase/issues/87)).
- **Simpler entity creation:** `IEntity.key` is optional ([#80](https://github.com/migration-script-runner/msr-firebase/issues/80)).
- **Runtime and data fixes:** Node.js `>=22.13.0` is required, with fixes for Firebase paths and entity behavior ([#76](https://github.com/migration-script-runner/msr-firebase/issues/76), [#84](https://github.com/migration-script-runner/msr-firebase/issues/84), [#102](https://github.com/migration-script-runner/msr-firebase/issues/102)).

See the [v0.2.x to v1.0.0 migration guide](https://firebase.migration-script-runner.dev/version-migration/v0.2-to-v1.0.html) and the [complete changelog](CHANGELOG.md).

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Use the Library](#use-the-library)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

MSR Core is the shared migration engine behind the MSR family. MSR Firebase connects its migration, validation, locking, backup, and rollback capabilities to Firebase Realtime Database, then adds Firebase configuration, database services, and emulator support.

### Migration workflow

- 📝 **Versioned TypeScript and JavaScript migrations:** write typed scripts with Firebase database access.
- 🔄 **Apply and roll back changes:** run pending migrations, target a version, and define `up()` and `down()` behavior.
- ✅ **Validate migrations and checksums:** catch invalid scripts and changes to migration files.
- 📊 **Track migration status:** inspect applied and pending migrations in the CLI or consume structured results in code.

### Safety and recovery

- 🔒 **Distributed migration locking:** coordinate concurrent migration runs using locks stored in Realtime Database, with expiration and ownership checks.
- 🖥️ **Manage locks from the CLI:** inspect lock status and release a stale lock.
- 💾 **Automatic backups and rollback strategies:** configure how backups are created and restored during migration runs.
- 🎯 **Choose backup scope:** back up selected database paths or keep full-database backups.

### Firebase integration and developer experience

- 🔑 **Firebase Admin authentication:** connect with a service-account JSON key file.
- 🌐 **Environment path shifting:** run against separate data paths for development, staging, and production.
- ⚙️ **Flexible configuration:** use environment variables, config files, or CLI flags, including Core-managed configuration loading.
- 🔌 **Firebase CLI tools:** inspect connection details, test connectivity, and work with Firebase nodes.
- 🧩 **Typed runner API:** integrate migrations into a Node.js application through `FirebaseRunner`.
- 🔔 **Application integrations:** add custom logging, migration lifecycle hooks, and metrics collectors.
- 📦 **Entity services:** use typed CRUD operations and batch entity updates.
- ⚡ **Firebase-aware transactions:** perform atomic read-modify-write operations at a single database node.
- 🧪 **Emulator testing:** exercise migration workflows against the local Firebase Realtime Database Emulator.

Explore the [complete feature list](https://firebase.migration-script-runner.dev/features.html) for details and links to the relevant guides.

## Installation

Requires Node.js `>=22.13.0` and npm.

```bash
npm install @migration-script-runner/firebase
```

## Quick Start

Set the URL of your Realtime Database and credentials. The URL format depends on the database location; replace the placeholder with the URL shown in Firebase Console.

```bash
export DATABASE_URL="https://DATABASE-NAME.REGION.firebasedatabase.app"
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
```

Then run pending migrations from the default `./migrations` folder:

```bash
npx msr-firebase migrate
```

You can also pass connection settings directly:

```bash
npx msr-firebase migrate \
  --database-url "https://DATABASE-NAME.REGION.firebasedatabase.app" \
  --credentials "./serviceAccountKey.json"
```

To roll back migrations newer than a target version, pass the numeric target:

```bash
npx msr-firebase down 202501150001
```

See the [Getting Started guide](https://firebase.migration-script-runner.dev/getting-started.html) for setup details and the [CLI guide](https://firebase.migration-script-runner.dev/cli-usage/) for commands and options.

## Use the Library

Create a runner with a Firebase configuration and run migrations from Node.js:

```typescript
import { FirebaseConfig, FirebaseRunner } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

For Core-managed configuration loading, call `FirebaseRunner.getInstance({})` without supplying `config`. Explore [Library Usage](https://firebase.migration-script-runner.dev/library-usage/) and the [API Reference](https://firebase.migration-script-runner.dev/api/).

## Documentation

- [Getting Started](https://firebase.migration-script-runner.dev/getting-started.html)
- [CLI commands and configuration](https://firebase.migration-script-runner.dev/cli-usage/)
- [Library usage and configuration](https://firebase.migration-script-runner.dev/library-usage/)
- [Writing migrations](https://firebase.migration-script-runner.dev/writing-migrations/)
- [Backup and restore](https://firebase.migration-script-runner.dev/writing-migrations/backup-restore.html)
- [Firebase Emulator testing](https://firebase.migration-script-runner.dev/writing-migrations/testing.html)
- [API Reference](https://firebase.migration-script-runner.dev/api/)

## Contributing

Contributions are welcome. Read the [Contributing Guide](CONTRIBUTING.md), review [open issues](https://github.com/migration-script-runner/msr-firebase/issues), and follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security concerns, use the process in [SECURITY.md](SECURITY.md).

## License

MSR Firebase uses the [MIT License with Commons Clause and Attribution Requirements](LICENSE). See [NOTICE](NOTICE) for additional details.
