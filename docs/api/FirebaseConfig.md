---
layout: default
title: FirebaseConfig
parent: API Reference
nav_order: 2
---

# FirebaseConfig
{: .no_toc }

Firebase-specific configuration properties and path helpers.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Class

```typescript
class FirebaseConfig extends Config
```

`FirebaseConfig` extends MSR Core's `Config`. This page documents Firebase-specific members; for setup recipes and inherited options, see [Library Configuration](../library-usage/configuration) and the [MSR Core configuration reference](https://core.migration-script-runner.dev/configuration).

## Firebase Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `databaseUrl` | <code>string &#124; undefined</code> | `process.env.DATABASE_URL` | Firebase Realtime Database URL. Copy the URL for the selected database from Firebase Console; its host depends on the database location. |
| `applicationCredentials` | <code>string &#124; undefined</code> | `process.env.GOOGLE_APPLICATION_CREDENTIALS` | Path to a service-account JSON key file. Required by the current Firebase adapter when connecting. |
| `shift` | <code>string &#124; undefined</code> | `undefined` | Optional root path prefix for namespacing data in a shared database. |
| `backupPaths` | <code>string[] &#124; undefined</code> | `undefined` | Relative database paths included in Core-managed backups. Unset means back up the full database. |
| `tableName` | `string` | `'schema_version'` | Firebase path used to store migration records. |

`backupPaths` is resolved beneath `shift`. Empty, absolute, invalid, duplicate, and overlapping paths are rejected. See [Backup & Restore](../writing-migrations/backup-restore) for restore behavior.

## Path Helpers

### `buildPath(path: string): string`

Builds an absolute Firebase path, applying `shift` when configured.

```typescript
const config = new FirebaseConfig();
config.shift = 'production';
config.buildPath('users'); // production/users
```

### `getRoot(): string`

Returns the root path after applying `shift`.

```typescript
const config = new FirebaseConfig();
config.shift = 'production';
config.getRoot(); // production/
```

## Inherited Configuration

Standard options such as `folder`, `backupMode`, `rollbackStrategy`, `locking`, `logLevel`, and output settings come from MSR Core's `Config`. The logger itself is supplied through `FirebaseRunner.getInstance()` options, not stored on `FirebaseConfig`. See [Library Configuration](../library-usage/configuration) for Firebase-oriented examples and the [Core configuration reference](https://core.migration-script-runner.dev/configuration) for inherited options.
