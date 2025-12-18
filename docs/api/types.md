---
layout: default
title: Types
parent: API Reference
nav_order: 5
---

# Types
{: .no_toc }

TypeScript type definitions and utilities for MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## FirebaseDatabase

Type alias for Firebase Realtime Database.

```typescript
type FirebaseDatabase = admin.database.Database;
```

Used throughout MSR Firebase to represent the Firebase database instance.

---

## MigrationStatus

Status of a migration.

```typescript
type MigrationStatus = {
  timestamp: number;
  name: string;
  status: 'applied' | 'pending';
  appliedAt?: Date;
};
```

### Properties

- **timestamp**: Migration identifier
- **name**: Migration file name
- **status**: Whether migration is applied or pending
- **appliedAt** _(optional)_: When migration was applied

---

## BackupResult

Result of a backup operation.

```typescript
type BackupResult = {
  backupId: string;
  timestamp: Date;
  size: number;
  path: string;
};
```

### Properties

- **backupId**: Unique backup identifier
- **timestamp**: When backup was created
- **size**: Backup size in bytes
- **path**: Location of backup file

---

## RestoreResult

Result of a restore operation.

```typescript
type RestoreResult = {
  backupId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
};
```

### Properties

- **backupId**: Backup that was restored
- **timestamp**: When restore was performed
- **success**: Whether restore succeeded
- **error** _(optional)_: Error message if failed

---

## ValidationResult

Result of migration validation.

```typescript
type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};
```

### Properties

- **valid**: Overall validation status
- **errors**: Critical validation errors
- **warnings**: Non-critical warnings

---

## ValidationError

Validation error details.

```typescript
type ValidationError = {
  type: 'duplicate' | 'checksum' | 'missing' | 'format';
  message: string;
  migration?: string;
};
```

### Properties

- **type**: Type of validation error
- **message**: Error description
- **migration** _(optional)_: Affected migration file

---

## ValidationWarning

Validation warning details.

```typescript
type ValidationWarning = {
  type: 'performance' | 'deprecation' | 'suggestion';
  message: string;
  migration?: string;
};
```

### Properties

- **type**: Type of warning
- **message**: Warning description
- **migration** _(optional)_: Affected migration file

---

## Generic Database Type

MSR Firebase uses the generic type parameter `IDB` to represent the database type:

```typescript
// In your migrations
IMigrationScript<admin.database.Database>

// In FirebaseRunner
class FirebaseRunner extends MigrationScriptExecutor<admin.database.Database>
```

This provides full TypeScript type safety for Firebase operations.

## Usage Examples

### Using MigrationStatus

```typescript
const statuses: MigrationStatus[] = await runner.list();

statuses.forEach(status => {
  if (status.status === 'pending') {
    console.log(`Pending: ${status.name}`);
  } else {
    console.log(`Applied: ${status.name} at ${status.appliedAt}`);
  }
});
```

### Using ValidationResult

```typescript
const validation: ValidationResult = await runner.validate();

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`${error.type}: ${error.message}`);
  });
}

validation.warnings.forEach(warning => {
  console.warn(`${warning.type}: ${warning.message}`);
});
```

## See Also

- [Interfaces](interfaces) - Core interfaces
- [Services](services) - Service implementations
- [MSR Core Types](https://migration-script-runner.github.io/msr-core/api/types/)
