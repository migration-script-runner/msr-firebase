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
- **TypeScript**: 4.5+ (if using TypeScript)

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

### Peer Dependencies

MSR Firebase requires Firebase Admin SDK as a peer dependency:

```bash
npm install firebase-admin
```

## Project Setup

### 1. Initialize Firebase Admin SDK

Create a configuration file for Firebase initialization:

```typescript
// firebase-config.ts
import * as admin from 'firebase-admin';

export function initializeFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  return admin.database();
}
```

### 2. Create Migrations Directory

Create a directory for your migration files:

```bash
mkdir migrations
```

### 3. Configure Environment Variables

Create a `.env` file with your Firebase credentials:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

{: .warning }
> Never commit your `.env` file or service account keys to version control. Add them to `.gitignore`.

## Verify Installation

Create a test script to verify the installation:

```typescript
// test-setup.ts
import { FirebaseRunner } from '@migration-script-runner/firebase';
import { initializeFirebase } from './firebase-config';

async function testSetup() {
  const db = initializeFirebase();

  const runner = new FirebaseRunner({
    db,
    migrationsPath: './migrations'
  });

  const status = await runner.list();
  console.log('MSR Firebase is ready!', status);
}

testSetup();
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

Verify CLI installation:

```bash
msr-firebase --version
```

## TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true
  },
  "include": ["migrations/**/*", "src/**/*"],
  "exclude": ["node_modules"]
}
```

## Troubleshooting

### Cannot find module '@migration-script-runner/firebase'

Ensure the package is installed in your project:
```bash
npm list @migration-script-runner/firebase
```

### Firebase Admin SDK initialization errors

Verify your environment variables are set correctly and the service account has proper permissions.

### TypeScript compilation errors

Ensure you have `@types/node` installed:
```bash
npm install -D @types/node
```

## Next Steps

- [Getting Started](getting-started) - Quick start guide
- [Writing Migrations](guides/writing-migrations) - Create your first migration
- [Configuration](guides/configuration) - Advanced configuration options

## See Also

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [MSR Core Installation](https://migration-script-runner.github.io/msr-core/getting-started)
