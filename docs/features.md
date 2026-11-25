---
layout: default
title: Features
nav_order: 3
---

# Features
{: .no_toc }

MSR Firebase brings database migrations to Firebase Realtime Database. It combines Firebase-specific integration with the migration workflow and extension points provided by MSR Core.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Firebase at a glance

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 24px 0;">
  <div style="background: #e8eaf6; padding: 20px; border-radius: 8px; border-left: 4px solid #5c6bc0;">
    <h3 style="color: #3f51b5; margin-top: 0;">🔥 Built for Firebase RTDB</h3>
    <p style="margin-bottom: 0;">Connect through Firebase Admin, use path shifting for environments, and test against the Firebase Emulator. Transactions are atomic at a single database node.</p>
  </div>
  <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #29b6f6;">
    <h3 style="color: #0277bd; margin-top: 0;">🛡️ Manage migration risk</h3>
    <p style="margin-bottom: 0;">Validate migrations, detect checksum changes, choose backup behavior, and enable database-level locking for concurrent migration runs.</p>
  </div>
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #66bb6a;">
    <h3 style="color: #2e7d32; margin-top: 0;">⚙️ Use the CLI or API</h3>
    <p style="margin-bottom: 0;">Run migrations with <code>msr-firebase</code> or integrate them into a Node.js application with <code>FirebaseRunner</code> and structured results.</p>
  </div>
  <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ffa726;">
    <h3 style="color: #e65100; margin-top: 0;">📘 Work with TypeScript</h3>
    <p style="margin-bottom: 0;">Write typed migration classes, use Firebase-specific data services, and run local integration checks with the Firebase Emulator.</p>
  </div>
</div>

---

## Features by category

The tables group MSR Firebase capabilities by the work they support. Feature names link to the relevant guide, configuration page, or API reference.

### Firebase integration and configuration

| Feature | What it provides |
|---------|------------------|
| **🔥 [Realtime Database support](getting-started)** | Connect migrations to Firebase Realtime Database through the Firebase Admin SDK. |
| **🔑 [Firebase authentication](getting-started#configure-firebase-credentials)** | Authenticate with a service-account key or Application Default Credentials. |
| **🌐 [Path shifting](library-usage/configuration#shift)** | Keep environment data under a configured path prefix in a shared database. |
| **🧪 [Firebase Emulator support](writing-migrations/testing)** | Run migration tests against a local Realtime Database Emulator. |
| **🔌 [Connection diagnostics](cli-usage/commands)** | Inspect Firebase connection information and test connectivity with Firebase-specific CLI commands. |
| **⚙️ [Environment and file configuration](cli-usage/configuration#environment-variables)** | Configure Firebase credentials and database settings with environment variables, config files, or CLI flags. |

### Migration workflow

| Feature | What it provides |
|---------|------------------|
| **📝 [TypeScript and JavaScript migrations](writing-migrations/migration-scripts)** | Define migrations as versioned classes with typed database access. |
| **🔄 [Up and down migrations](writing-migrations/migration-scripts)** | Apply changes with <code>up()</code> and define rollback behavior with <code>down()</code>. |
| **📦 [Batch execution](cli-usage/commands#migrate)** | Apply pending migrations with the CLI or programmatic runner. |
| **🎯 [Targeted execution](library-usage/examples#targeted-migration-execution)** | Run migrations to a selected version or choose a target through the runner API. |
| **📊 [Migration status](cli-usage/commands#list)** | Inspect applied and pending migrations. |
| **✅ [Validation and checksums](cli-usage/commands#validate)** | Validate migrations before execution and detect changes to migration files through Core validation. |

### Locking, backup, and recovery

| Feature | What it provides |
|---------|------------------|
| **🔒 [Database-level migration locking](writing-migrations/migration-locking)** | Coordinate migration runs through a lock stored in Firebase Realtime Database when locking is enabled. |
| **⏱️ [Lock expiration and ownership checks](writing-migrations/migration-locking#automatic-expiration)** | Configure lock timeouts and verify lock ownership during release. |
| **🖥️ [Lock management commands](cli-usage/commands#lockstatus)** | Inspect a lock and release a stale lock through the CLI. |
| **💾 [Automatic backups](writing-migrations/backup-restore#automatic-backup-and-rollback)** | Use Core-managed backups during migration execution according to the configured backup mode. |
| **🎚️ [Backup modes](library-usage/configuration#backupmode)** | Choose `full`, `create_only`, `restore_only`, or `manual` behavior. |
| **🎯 [Selective backup paths](library-usage/configuration#backuppaths)** | Back up selected database paths or leave the setting empty for a full-database backup. |
| **🔙 [Restore and rollback](writing-migrations/backup-restore#restore-a-backup)** | Restore a saved backup through the API or CLI and choose a rollback approach for migrations. |
| **☸️ [Container deployment examples](writing-migrations/migration-locking#deployment-examples)** | Review Kubernetes and Docker Compose examples for migration locking. |

### CLI and library API

| Feature | What it provides |
|---------|------------------|
| **🖥️ [Migration CLI](cli-usage/)** | Run migration, list, down, validate, backup, restore, and lock-management commands. |
| **🔥 [Firebase-specific CLI commands](cli-usage/commands)** | Inspect Firebase information, test the connection, work with nodes, and back up selected nodes. |
| **🚩 [CLI configuration options](cli-usage/configuration)** | Set the database URL, credentials, backup behavior, and standard MSR options. |
| **📊 [Table and JSON output](cli-usage/examples#json-format)** | Display migration status for people in tables or consume grouped migration records in scripts as JSON. |
| **🧩 [FirebaseRunner](api/FirebaseRunner)** | Create a configured Firebase runner and call migration operations from application code. |
| **⚙️ [FirebaseConfig](api/FirebaseConfig)** | Configure Firebase-specific settings alongside supported Core options. |
| **📋 [Structured results](library-usage/examples#with-error-handling-and-rollback)** | Handle migration outcomes in application code without terminating the host process with <code>process.exit()</code>. |

### Data services and transactions

| Feature | What it provides |
|---------|------------------|
| **📦 [EntityService](api/services#entityservice)** | Perform typed CRUD operations for collections of Firebase entities. |
| **🔄 [Batch entity updates](api/services#updateall)** | Transform multiple entities with <code>updateAll()</code>. |
| **🗃️ [FirebaseDataService](api/services#firebasedataservice)** | Use lower-level Firebase database operations provided by the adapter. |
| **🔐 [Single-node transactions](writing-migrations/transactions#single-node-atomic-operations)** | Perform atomic read-modify-write operations at one Realtime Database node; Firebase does not provide database-wide transactions. |

### Developer experience and testing

| Capability | What it means |
|------------|---------------|
| **📘 [TypeScript-first API](writing-migrations/migration-scripts)** | Use typed migration contracts and Firebase database types in application code. |
| **🧪 [Emulator-based integration tests](writing-migrations/testing#integration-test-a-migration)** | Exercise migrations against a local Firebase Realtime Database Emulator. |
| **📚 [Guides and API reference](.)** | Find setup, migration, CLI, library, configuration, and API documentation from the site navigation. |
| **🧰 [MSR Core foundation](https://core.migration-script-runner.dev)** | Use the shared migration engine and adapter contracts provided by MSR Core. |

---

## Choose by use case

| If you need to... | Start with... |
|-------------------|---------------|
| Set up Firebase credentials and run your first migration | [Getting Started](getting-started) |
| Test migration behavior before deployment | [Firebase Emulator testing](writing-migrations/testing) and [migration validation](cli-usage/commands#validate) |
| Separate development, staging, and production data | [Path shifting](library-usage/configuration#shift) and [configuration](library-usage/configuration) |
| Coordinate migration runs in multiple processes | [Migration locking](writing-migrations/migration-locking) |
| Choose a backup and rollback approach | [Backup and restore](writing-migrations/backup-restore) and [backup configuration](library-usage/configuration#backupmode) |
| Run migrations from an application | [Library usage](library-usage/) and [FirebaseRunner](api/FirebaseRunner) |
| Work with typed Firebase entities | [EntityService](api/services#entityservice) |

---

## Get started

- **[Getting Started](getting-started)** — Install MSR Firebase and run your first migration.
- **[CLI Usage](cli-usage/)** — Configure and use the `msr-firebase` command.
- **[Library Usage](library-usage/)** — Run migrations from a Node.js application.
- **[Writing Migrations](writing-migrations/)** — Build, validate, and test migration scripts.
- **[API Reference](api/)** — Explore Firebase-specific classes, interfaces, and types.
- **[MSR Ecosystem](https://migration-script-runner.dev/ecosystem)** — See the projects in the Migration Script Runner family.

---

## Release history and upgrades

- **[GitHub Releases](https://github.com/migration-script-runner/msr-firebase/releases)** — Browse MSR Firebase release notes.
- **[Version migration guides](version-migration/)** — Read upgrade guidance between supported versions.
