---
layout: default
title: Installation
nav_order: 3
---

# Installation
{: .no_toc }

Detailed installation and setup instructions for MSR Firebase.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Requirements

### System Requirements

- **Node.js**: 16.x or higher
- **npm**: 7.x or higher (or yarn 1.22+)
- **TypeScript**: 4.5+ (optional, for TypeScript projects)

### Firebase Requirements

- Firebase project with Realtime Database enabled
- Firebase Admin SDK service account credentials
- Network access to Firebase services

## Installation Methods

### NPM

```bash
npm install @migration-script-runner/firebase
```

### Yarn

```bash
yarn add @migration-script-runner/firebase
```

### Dependencies

MSR Firebase bundles all required dependencies, including Firebase Admin SDK. No additional packages are required.

## Quick Setup

### Option 1: Using CLI Flags (Recommended)

The fastest way to get started:

```bash
# Install
npm install @migration-script-runner/firebase

# Create migrations directory
mkdir migrations

# Run with credentials
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json
```

### Option 2: Using Environment Variables

Create a `.env` file:

```bash
DATABASE_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Then run:

```bash
npx msr-firebase migrate
```

{: .warning }
> Never commit your `.env` file or service account keys to version control. Add them to `.gitignore`.

## Service Account Key Setup

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json`

### 2. Secure Your Credentials

```bash
# Add to .gitignore
echo "serviceAccountKey.json" >> .gitignore
echo ".env" >> .gitignore
```

## Project Setup

### 1. Create Migrations Directory

```bash
mkdir migrations
```

### 2. Create First Migration

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
      user1: { name: 'Alice', role: 'admin' }
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

### 3. Run Migrations

```bash
# With CLI flags
npx msr-firebase migrate \
  --database-url https://your-project.firebaseio.com \
  --credentials ./serviceAccountKey.json

# Or with environment variables
npx msr-firebase migrate
```

## Programmatic Usage

For integrating MSR Firebase into your application:

```typescript
import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';

async function runMigrations() {
  // Configure
  const config = new FirebaseConfig();
  config.databaseUrl = process.env.DATABASE_URL;
  config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  config.folder = './migrations';
  config.tableName = 'schema_version';

  // Initialize runner (handler creation is automatic)
  const runner = await FirebaseRunner.getInstance({ config });

  // Run migrations
  const result = await runner.migrate();
  console.log(`Applied ${result.executed.length} migrations`);
}

runMigrations();
```

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

### Test Programmatic API

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

Run the test:

```bash
npx ts-node test-setup.ts
```

## CLI Installation

To use the `msr-firebase` CLI globally:

```bash
npm install -g @migration-script-runner/firebase
```

Verify global installation:

```bash
msr-firebase --version
```

## TypeScript Configuration

Recommended `tsconfig.json` for migration scripts:

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
- Has proper permissions (readable)

**Error:** `PERMISSION_DENIED`

**Solution:** Verify your service account has Database Admin role:
1. Go to Firebase Console → IAM & Admin
2. Find your service account
3. Ensure it has "Firebase Realtime Database Admin" role

### Environment variables not loading

Install `dotenv` to load `.env` files:
```bash
npm install dotenv
```

Use in your code:
```typescript
import 'dotenv/config';
import { FirebaseRunner } from '@migration-script-runner/firebase';
// ... rest of your code
```

### TypeScript compilation errors

Ensure type definitions are installed:
```bash
npm install -D @types/node typescript
```

### CLI command not found

If global install doesn't work, use npx:
```bash
npx msr-firebase migrate
```

Or add to `package.json` scripts:
```json
{
  "scripts": {
    "migrate": "msr-firebase migrate",
    "migrate:down": "msr-firebase down"
  }
}
```

## Configuration Files

### Using Config Files

Create `msr.config.js`:

```javascript
module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  applicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  folder: './migrations',
  tableName: 'schema_version',
  shift: 'production', // Optional: namespace for multi-environment databases
  locking: {
    enabled: true,
    timeout: 600000 // 10 minutes
  }
};
```

Use with CLI:
```bash
npx msr-firebase migrate --config-file ./msr.config.js
```

