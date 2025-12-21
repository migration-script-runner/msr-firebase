---
layout: default
title: Features
nav_order: 3
---

# Features
{: .no_toc }

MSR Firebase is a production-ready migration framework for Firebase Realtime Database with powerful features for safe, reliable database migrations.
{: .fs-6 .fw-300 }

## Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Complete Features List

### Firebase-Specific Features
- **[Firebase Realtime Database Support](getting-started)** - Native support for Firebase Admin SDK
- **[Single-Node Transactions](writing-migrations/transactions)** - Atomic operations via Firebase's `ref.transaction()`
- **[Path Prefixing](api/FirebaseConfig#shift)** - Multi-environment databases with path shifting
- **[Firebase Emulator Support](writing-migrations/testing)** - Test migrations locally before production
- **[Firebase Authentication](getting-started#get-service-account-key)** - Service account key or Application Default Credentials
- **[Firebase Connection Testing](cli-usage/commands#firebasetest-connection)** - Verify database connectivity and credentials

### Migration Execution
- **[TypeScript/JavaScript Migrations](writing-migrations/migration-scripts)** - Write migrations as ES6 classes with full type safety
- **[Up/Down Methods](writing-migrations/migration-scripts#updown-methods)** - Reversible migrations with flexible down() policies
- **[Batch Execution](cli-usage/commands#migrate)** - Execute multiple migrations with progress tracking
- **[Target Version Migration](cli-usage/commands#migrate-to-version)** - Migrate up to specific version or down to a version
- **[Entity Service Helper](api/services#entityservice)** - Type-safe CRUD operations for Firebase entities

### Migration Locking (v0.2.0+)
- **[Database-Level Locking](writing-migrations/migration-locking)** - Prevent concurrent migrations in distributed environments
- **[Kubernetes Support](writing-migrations/migration-locking#kubernetes-deployment)** - Safe migrations in multi-pod deployments
- **[Docker Swarm/Compose Support](writing-migrations/migration-locking#docker-swarm--compose)** - Multi-replica container support
- **[Automatic Lock Expiration](writing-migrations/migration-locking#lock-timeout-configuration)** - Configurable timeouts with automatic cleanup
- **[Lock Management CLI](cli-usage/commands#lockstatus)** - Check lock status and force-release stuck locks
- **[Lock Ownership Verification](writing-migrations/migration-locking#how-it-works)** - Two-phase locking prevents race conditions

### Safety & Rollback
- **[Automatic Backups](writing-migrations/backup-restore)** - Create Firebase database backups before migration execution
- **[Multiple Backup Modes](writing-migrations/backup-restore#backup-modes)** - Full, incremental, or none - choose what fits your needs
- **[Backup Restore](cli-usage/commands#restore)** - Restore from any previous backup
- **[Rollback with down()](cli-usage/commands#down)** - Execute down() methods to reverse migrations
- **[Checksum Validation](writing-migrations/best-practices#checksum-validation)** - Detect unauthorized changes to executed migrations
- **[Pre-Migration Validation](cli-usage/commands#validate)** - Catch issues before execution starts

### CLI Features
- **[Complete CLI Interface](cli-usage/)** - `msr-firebase` command with all migration operations
- **[Firebase-Specific Commands](cli-usage/commands#firebase-specific-commands)** - `firebase:info`, `firebase:test-connection`, `firebase:nodes`
- **[Database URL Override](cli-usage/configuration#--database-url)** - Inline credentials without environment variables
- **[Service Account Credentials](cli-usage/configuration#--credentials)** - Pass credentials via CLI flag
- **[Config File Support](cli-usage/configuration#--config-file)** - Load configuration from `msr.config.js`
- **[Environment Variables](cli-usage/configuration#environment-variables)** - 12-factor app configuration with `DATABASE_URL` and `GOOGLE_APPLICATION_CREDENTIALS`

### Library Features
- **[Programmatic API](library-usage/)** - Full TypeScript API for application integration
- **[FirebaseRunner](api/FirebaseRunner)** - Main migration runner with singleton pattern
- **[FirebaseConfig](api/FirebaseConfig)** - Type-safe configuration class
- **[FirebaseHandler](api/FirebaseHandler)** - Database handler with Firebase Admin SDK integration
- **[Type-Safe Migrations](writing-migrations/migration-scripts#type-safety)** - Generic type parameters with `IFirebaseDB`
- **[Structured Results](library-usage/examples#handling-results)** - Returns results instead of calling `process.exit()`

### Data Services
- **[EntityService](api/services#entityservice)** - Type-safe CRUD operations for Firebase entities
- **[FirebaseDataService](api/services#firebasedataservice)** - Low-level Firebase operations with atomic transactions
- **[Batch Operations](api/services#batch-operations)** - Efficient multi-document operations
- **[Pagination Support](api/services#pagination)** - Limit and offset queries for large datasets

### Configuration & Flexibility
- **[Multiple Configuration Methods](library-usage/configuration)** - Environment variables, config files, or programmatic
- **[Path Shifting](api/FirebaseConfig#shift)** - Prefix all Firebase paths for multi-environment databases
- **[Custom Table Names](api/FirebaseConfig#tableName)** - Configure schema version tracking location
- **[Backup Configuration](api/FirebaseConfig#backupMode)** - Control backup behavior and storage
- **[Locking Configuration](api/FirebaseConfig#locking)** - Enable/disable and configure migration locking

### Developer Experience
- **[TypeScript First](getting-started#typescript-setup)** - Written in TypeScript with full type definitions
- **[MSR Core Integration](https://migration-script-runner.github.io/msr-core)** - Built on proven MSR Core architecture
- **[Comprehensive Documentation](.)** - Complete guides, examples, and API reference
- **[Zero Config Defaults](getting-started#quick-start)** - Works out of the box with sensible defaults
- **[Firebase Emulator Testing](writing-migrations/testing)** - Complete local testing workflow
- **[Integration Tests](writing-migrations/testing#integration-tests)** - Real examples in test suite

---

## Features by Category

### 🔥 Firebase Native Features

| Feature | Description |
|---------|-------------|
| **🔥 Firebase Realtime Database** | Native support for Firebase Admin SDK with full API access |
| **🔒 Single-Node Transactions** | Atomic operations via Firebase's `ref.transaction()` for safe concurrent updates |
| **🎯 Path Prefixing** | Multi-environment support with automatic path shifting (`production/`, `staging/`, etc.) |
| **🧪 Emulator Support** | Test migrations locally with Firebase Emulator before production deployment |
| **🔑 Flexible Authentication** | Service account key file or Application Default Credentials |
| **🌐 Connection Testing** | Built-in command to verify database connectivity and credentials |

### 🔒 Migration Locking (Production Ready)

| Feature | Description |
|---------|-------------|
| **🔐 Database-Level Locking** | Prevent concurrent migrations across multiple instances using Firebase atomic operations |
| **☸️ Kubernetes Compatible** | Safe migrations in multi-pod deployments with automatic lock management |
| **🐳 Docker Support** | Works seamlessly with Docker Swarm and Docker Compose multi-replica setups |
| **⏱️ Automatic Expiration** | Configurable lock timeouts (default 10 minutes) with automatic cleanup |
| **🖥️ Lock Management CLI** | `lock:status` and `lock:release` commands for production troubleshooting |
| **🛡️ Two-Phase Locking** | Lock ownership verification prevents race conditions and ensures safety |

### 💾 Backup & Restore

| Feature | Description |
|---------|-------------|
| **💾 Automatic Backups** | Create JSON backups of Firebase database before migrations |
| **📊 Multiple Backup Modes** | Choose from full database, incremental, or no backup based on your needs |
| **🔙 Point-in-Time Restore** | Restore database from any previous backup with single command |
| **📁 Backup Management** | List available backups with timestamps and metadata |
| **🗜️ Compressed Storage** | Efficient JSON format with optional compression |
| **🎯 Selective Backup** | Backup only affected paths or entire database |

### 🛡️ Type Safety & Developer Experience

| Feature | Description |
|---------|-------------|
| **📘 TypeScript First** | Full TypeScript support with generic type parameters |
| **🎯 Database Type Safety** | `IFirebaseDB` interface provides IDE autocomplete and compile-time checks |
| **🧩 Generic Migrations** | Type-safe migration classes with `IRunnableScript<IFirebaseDB>` |
| **📦 Entity Service** | Generic `EntityService<T>` for type-safe CRUD operations |
| **🔍 IntelliSense Support** | Full IDE support with method signatures and parameter hints |
| **✅ Compile-Time Checks** | Catch errors before runtime with TypeScript compiler |

### 📦 CLI & Library

| Feature | Description |
|---------|-------------|
| **🖥️ Complete CLI** | `msr-firebase` command with all migration operations |
| **🔧 Programmatic API** | Use as library in Node.js applications with `FirebaseRunner` |
| **⚙️ Flexible Configuration** | Environment variables, config files, or inline CLI flags |
| **📊 Structured Results** | Library mode returns result objects instead of `process.exit()` |
| **🎨 Output Formats** | Table, JSON, or silent output for different use cases |
| **🌍 Environment Detection** | Automatic detection of `.env` files and environment variables |

### 🔄 Migration Management

| Feature | Description |
|---------|-------------|
| **📝 Version-Based Naming** | Timestamp-based migration files (e.g., `V202501010001_create_users.ts`) |
| **⬆️ Up Migrations** | Apply migrations to update database schema and data |
| **⬇️ Down Migrations** | Reverse migrations with down() methods for rollback |
| **📊 Migration Status** | List all migrations with applied/pending status |
| **🎯 Target Version** | Migrate to specific version or roll back to earlier state |
| **✅ Checksum Validation** | Detect unauthorized changes to executed migrations |

### 🔍 Validation & Quality

| Feature | Description |
|---------|-------------|
| **✅ Pre-Migration Validation** | Validate all migrations before execution to catch issues early |
| **🔎 Duplicate Detection** | Prevent timestamp collisions and duplicate migration files |
| **📝 Structure Validation** | Ensure migrations follow required naming and structure conventions |
| **⚠️ Connection Validation** | Verify Firebase connectivity before attempting migrations |
| **🛡️ Checksum Verification** | Detect modifications to previously executed migrations |

### 📊 Data Services

| Feature | Description |
|---------|-------------|
| **🗃️ EntityService** | Type-safe CRUD operations: create, read, update, delete, list with generic types |
| **📄 FirebaseDataService** | Low-level Firebase operations with transaction support |
| **🔄 Atomic Operations** | Use Firebase transactions for safe concurrent updates |
| **📦 Batch Operations** | Efficient multi-entity updates with single database call |
| **📖 Pagination** | Built-in limit and offset support for large collections |
| **🔍 Query Support** | Firebase query operations with orderBy, limitToFirst, startAt |

### 🚀 Production Features

| Feature | Description |
|---------|-------------|
| **🔒 Distributed Locking** | Safe concurrent migration prevention across all instances |
| **💾 Automatic Backups** | Database backups before every migration run |
| **📈 Progress Tracking** | Real-time progress for long-running migrations |
| **🎯 Zero Downtime** | Non-blocking migrations with proper transaction handling |
| **📊 Execution History** | Complete audit trail of all migrations with timestamps |
| **🛡️ Error Recovery** | Automatic rollback on failure with backup restore |

### 🐳 Platform Support

| Feature | Description |
|---------|-------------|
| **☸️ Kubernetes** | ConfigMaps and Secrets integration, safe multi-pod deployments |
| **🐳 Docker** | Environment variable configuration, Docker Swarm/Compose support |
| **⚙️ CI/CD Integration** | GitHub Actions, GitLab CI, Jenkins - works in all pipelines |
| **🖥️ Cross-Platform** | Works on Linux, macOS, and Windows |
| **📦 npm Package** | Easy installation: `npm install @migration-script-runner/firebase` |
| **🌐 Serverless Ready** | Use in Cloud Functions, Lambda with proper initialization |

---

## Quick Feature Comparison

Compare MSR Firebase features across different use cases:

| Use Case | Key Features |
|----------|--------------|
| **Development** | Fast iteration, down() methods, Firebase Emulator, TypeScript support, local testing |
| **CI/CD** | Automated validation, checksum verification, environment variables, structured output |
| **Production** | Migration locking, automatic backups, error recovery, audit trails, lock management CLI |
| **Kubernetes** | Database-level locking, ConfigMap integration, multi-pod safety, automatic lock cleanup |
| **Docker** | Environment variables, Swarm support, replica safety, container-ready configuration |
| **Serverless** | Structured results, programmatic API, no process.exit(), quick initialization |

---

## What Makes MSR Firebase Different?

### Built for Firebase Realtime Database

Unlike generic migration tools, MSR Firebase is built specifically for Firebase:
- **Native Firebase SDK integration** - Full access to Firebase Admin SDK features
- **Understands Firebase limitations** - Clear documentation of single-node transaction constraints
- **Firebase-specific helpers** - EntityService, FirebaseDataService for common patterns
- **Emulator support** - Test migrations locally before production
- **Path prefixing** - Built-in multi-environment support

### Production-Ready Locking

First Firebase migration tool with proper distributed locking:
- **Database-level locks** - Uses Firebase atomic operations, not file locks
- **Kubernetes-tested** - Safe for multi-pod deployments
- **Automatic expiration** - Configurable timeouts prevent stuck locks
- **CLI management** - Force-release locks when needed
- **Two-phase verification** - Ownership checks prevent race conditions

### Library-First Design

Unlike most migration tools, MSR Firebase returns structured results:
- Safe to use in web servers (Express, Fastify, NestJS)
- Works in serverless functions (Cloud Functions, Lambda)
- No unexpected `process.exit()` calls
- Full error details in return values
- Perfect for application integration

### Type-Safe Migrations

Full TypeScript support throughout:
- Generic type parameters for database operations
- IDE autocomplete for all methods
- Compile-time error detection
- Type-safe EntityService with generics
- No casting or type assertions needed

---

## Getting Started

Ready to use these features? Start here:

- **[Getting Started Guide](getting-started)** - Quick start in 5 minutes
- **[CLI Usage](cli-usage/)** - Command-line interface guide
- **[Library Usage](library-usage/)** - Programmatic API usage
- **[Writing Migrations](writing-migrations/)** - How to write migration scripts
- **[API Reference](api/)** - Complete API documentation

---

## Feature Highlights by Version

### v0.2.0 (Current - Unstable)

{: .warning }
**⚠️ Unstable Version:** v0.2.0 is currently under active development and not recommended for production use.

- 🔒 **Migration Locking** - Database-level locking for distributed environments (Kubernetes, Docker, multi-instance)
- ⬆️ **MSR Core v0.8.1** - Latest core with bug fixes, handler access API, and improved locking lifecycle
- 🔧 **Type-Safe API** - Full TypeScript support with generic type parameters throughout
- 🖥️ **Lock Management CLI** - `lock:status` and `lock:release` commands for production lock management
- 📚 **Comprehensive Documentation** - Complete restructure with CLI/Library/Writing Migrations sections
- 🎨 **Professional Site** - Favicon, Key Features cards, improved navigation

### v0.1.x (Stable)
- ✨ **Core Migration Engine** - Basic up/down migration execution
- 🔥 **Firebase Integration** - Firebase Admin SDK integration with service account authentication
- 💾 **Backup & Restore** - Automatic JSON backups with restore capability
- 📦 **EntityService** - Type-safe CRUD operations helper
- 🖥️ **Complete CLI** - `msr-firebase` command with all standard operations
- 📘 **TypeScript Support** - Full type safety with interfaces and generics
- 🧪 **Emulator Support** - Firebase Emulator testing workflow
- ✅ **Checksum Validation** - Detect modified migrations
- 🎯 **Path Prefixing** - Multi-environment database support with shift configuration

---

## Community & Support

- **📚 Documentation**: [Full documentation site](https://migration-script-runner.github.io/msr-firebase/)
- **🐛 Issues**: [GitHub Issues](https://github.com/migration-script-runner/msr-firebase/issues)
- **📦 npm**: [@migration-script-runner/firebase](https://www.npmjs.com/package/@migration-script-runner/firebase)
- **💬 MSR Core**: [MSR Core Documentation](https://migration-script-runner.github.io/msr-core)

---

{: .text-center }
![Made in Ukraine](https://img.shields.io/badge/in%20Ukraine-dodgerblue?label=Proudly%20made&labelColor=%23FFFF00)
