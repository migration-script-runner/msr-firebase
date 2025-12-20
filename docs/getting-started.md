---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Quick start guide to get up and running with MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Prerequisites

- Node.js 16.x or higher
- Firebase project with Realtime Database enabled
- Firebase Admin SDK service account credentials

---

## Installation

Install MSR Firebase via npm:

```bash
npm install @migration-script-runner/firebase
```

Or with Yarn:

```bash
yarn add @migration-script-runner/firebase
```

---

## Quick Start

### 1. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json`

{: .warning }
> Never commit your service account key to version control. Add it to `.gitignore`:
> ```bash
> echo "serviceAccountKey.json" >> .gitignore
> echo ".env" >> .gitignore
> ```

### 2. Create Migrations Directory

```bash
mkdir migrations
```

### 3. Create Your First Migration

```typescript
// migrations/V202501010001_create_users.ts
import { IRunnableScript, IMigrationInfo } from '@migration-script-runner/core';
import { IFirebaseDB, FirebaseHandler } from '@migration-script-runner/firebase';

export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
  async up(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    const usersRef = db.database.ref(handler.cfg.buildPath('users'));
    await usersRef.set({
      user1: { name: 'Alice', email: 'alice@example.com', role: 'admin' }
    });
    return 'Created users node';
  }

  async down(
    db: IFirebaseDB,
    info: IMigrationInfo,
    handler: FirebaseHandler
  ): Promise<string> {
    await db.database.ref(handler.cfg.buildPath('users')).remove();
    return 'Removed users node';
  }
}
```

### 4. Run Migrations

**Using CLI (recommended for getting started):**

```bash
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

**Or set environment variables:**

```bash
# Create .env file
echo "DATABASE_URL=https://your-project.firebaseio.com" >> .env
echo "GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json" >> .env

# Run migrations
npx msr-firebase migrate
```

**Or programmatically:**

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

const config = new FirebaseConfig();
config.databaseUrl = process.env.DATABASE_URL;
config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
config.folder = './migrations';

const runner = await FirebaseRunner.getInstance({ config });
await runner.migrate();
```

---

## Verify Installation

### Test CLI

```bash
# Check version
npx msr-firebase --version

# Show help
npx msr-firebase --help

# Test connection
npx msr-firebase firebase:test-connection \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

### Test Programmatically

```typescript
// test-setup.ts
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function testSetup() {
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';

  const runner = await FirebaseRunner.getInstance({ config });
  const migrations = await runner.list();

  console.log('✓ MSR Firebase is ready!');
  console.log(`Found ${migrations.length} migrations`);
}

testSetup().catch(console.error);
```

---

## Configuration Options

### Environment Variables

```bash
# .env
DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
MSR_FOLDER=./migrations
MSR_TABLE_NAME=schema_version
```

### Config File

Create `msr.config.js`:

```javascript
module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  applicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  folder: './migrations',
  tableName: 'schema_version',
  shift: 'production', // Optional: for multi-environment databases
  backupMode: 'full',  // Automatic backup before migrations
  locking: {
    enabled: true,     // For distributed environments
    timeout: 600000    // 10 minutes
  }
};
```

Use with CLI:
```bash
npx msr-firebase migrate --config-file ./msr.config.js
```

---

## TypeScript Setup

Recommended `tsconfig.json` for migrations:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true
  },
  "include": ["migrations/**/*", "src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Troubleshooting

### Cannot find module '@migration-script-runner/firebase'

Ensure the package is installed:
```bash
npm list @migration-script-runner/firebase
```

If not found:
```bash
npm install @migration-script-runner/firebase
```

### Firebase authentication failed

**Error:** `Error: Failed to parse private key`

**Solution:** Check your service account key file:
- Path is correct
- File is valid JSON
- Has proper read permissions

**Error:** `PERMISSION_DENIED`

**Solution:** Verify your service account has "Firebase Realtime Database Admin" role:
1. Go to Firebase Console → IAM & Admin
2. Find your service account
3. Ensure it has the correct role

### Environment variables not loading

Install `dotenv`:
```bash
npm install dotenv
```

Use in your code:
```typescript
import 'dotenv/config';
// ... rest of your code
```

### CLI command not found

Use npx instead of global install:
```bash
npx msr-firebase migrate
```

Or add to `package.json` scripts:
```json
{
  "scripts": {
    "migrate": "msr-firebase migrate",
    "migrate:down": "msr-firebase down",
    "migrate:list": "msr-firebase list"
  }
}
```

---

## Next Steps

### For CLI Users
- **[CLI Commands](cli-usage/commands)** - Learn all available CLI commands
- **[CI/CD Integration](cli-usage/ci-cd)** - Integrate migrations into your pipeline
- **[CLI Examples](cli-usage/examples)** - Real-world CLI usage patterns

### For Library Users
- **[Quick Start](library-usage/quick-start)** - Programmatic usage examples
- **[Configuration](library-usage/configuration)** - Configure programmatically
- **[API Reference](api/)** - Complete API documentation

### Writing Migrations
- **[Migration Scripts](writing-migrations/migration-scripts)** - Learn to write migrations
- **[Testing](writing-migrations/testing)** - Test with Firebase Emulator
- **[Best Practices](writing-migrations/best-practices)** - Firebase-specific patterns
