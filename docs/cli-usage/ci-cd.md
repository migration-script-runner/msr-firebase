---
layout: default
title: CI/CD Integration
parent: CLI Usage
nav_order: 4
---

# CI/CD Integration
{: .no_toc }

Run MSR Firebase migrations in continuous integration and deployment pipelines.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## GitHub Actions

### Using CLI Flags (Recommended)

Store service account key as a secret and use CLI flags:

```yaml
name: Run Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Create service account key file
        run: echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}' > key.json

      - name: Run migrations
        run: |
          npx msr-firebase migrate \
            --database-url ${{ secrets.FIREBASE_DATABASE_URL }} \
            --credentials ./key.json \
            --backup-mode full

      - name: Cleanup
        if: always()
        run: rm -f key.json
```

### Using Environment Variables

```yaml
- name: Run migrations
  env:
    DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
    GOOGLE_APPLICATION_CREDENTIALS: ./key.json
  run: npx msr-firebase migrate
```

### With Validation

```yaml
- name: Validate migrations
  run: npx msr-firebase validate

- name: Run migrations
  run: |
    npx msr-firebase migrate \
      --database-url ${{ secrets.FIREBASE_DATABASE_URL }} \
      --credentials ./key.json
```

---

## GitLab CI

```yaml
migrate:
  stage: deploy
  image: node:20-alpine
  before_script:
    - npm ci
    - echo "$FIREBASE_SERVICE_ACCOUNT_KEY" > key.json
  script:
    - npx msr-firebase migrate
        --database-url $FIREBASE_DATABASE_URL
        --credentials ./key.json
        --backup-mode full
  after_script:
    - rm -f key.json
  only:
    - main
```

### With Manual Approval

```yaml
migrate:
  stage: deploy
  image: node:20-alpine
  before_script:
    - npm ci
    - echo "$FIREBASE_SERVICE_ACCOUNT_KEY" > key.json
  script:
    - npx msr-firebase migrate --database-url $FIREBASE_DATABASE_URL --credentials ./key.json
  after_script:
    - rm -f key.json
  when: manual  # Requires manual trigger
  only:
    - main
```

---

## CircleCI

```yaml
version: 2.1

jobs:
  migrate:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Create credentials file
          command: echo $FIREBASE_SERVICE_ACCOUNT_KEY | base64 -d > key.json
      - run:
          name: Run migrations
          command: |
            npx msr-firebase migrate \
              --database-url $FIREBASE_DATABASE_URL \
              --credentials ./key.json
      - run:
          name: Cleanup
          command: rm -f key.json
          when: always

workflows:
  version: 2
  deploy:
    jobs:
      - migrate:
          filters:
            branches:
              only: main
```

---

## Docker

### Using CLI Flags

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY migrations ./migrations
COPY serviceAccountKey.json ./key.json

CMD ["npx", "msr-firebase", "migrate", \
     "--database-url", "${DATABASE_URL}", \
     "--credentials", "./key.json"]
```

**Run:**
```bash
docker build -t msr-firebase-migrations .
docker run --env DATABASE_URL=https://your-project.firebaseio.com msr-firebase-migrations
```

### Using Environment Variables

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY migrations ./migrations

CMD ["npx", "msr-firebase", "migrate"]
```

**Run:**
```bash
docker run \
  --env DATABASE_URL=https://your-project.firebaseio.com \
  --env GOOGLE_APPLICATION_CREDENTIALS=/app/key.json \
  --volume $(pwd)/key.json:/app/key.json:ro \
  msr-firebase-migrations
```

---

## Kubernetes

### Job for One-Time Migrations

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: firebase-migrations
spec:
  template:
    spec:
      containers:
      - name: migrations
        image: your-registry/msr-firebase-migrations:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: firebase-secrets
              key: database-url
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: /secrets/firebase-key.json
        volumeMounts:
        - name: firebase-credentials
          mountPath: /secrets
          readOnly: true
      volumes:
      - name: firebase-credentials
        secret:
          secretName: firebase-service-account
      restartPolicy: Never
  backoffLimit: 3
```

### Init Container for Application Pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      initContainers:
      - name: run-migrations
        image: your-registry/msr-firebase-migrations:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: firebase-secrets
              key: database-url
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: /secrets/firebase-key.json
        volumeMounts:
        - name: firebase-credentials
          mountPath: /secrets
          readOnly: true
      containers:
      - name: app
        image: your-app:latest
      volumes:
      - name: firebase-credentials
        secret:
          secretName: firebase-service-account
```

---

## Best Practices

### Security

**Store Credentials Securely:**
- Use CI/CD secrets management
- Never commit service account keys to git
- Use short-lived credentials when possible
- Clean up credential files after use

**Example Cleanup:**
```yaml
- name: Cleanup
  if: always()
  run: rm -f key.json
```

### Validation

**Always validate before deploying:**
```bash
npx msr-firebase validate
npx msr-firebase migrate --dry-run
npx msr-firebase migrate
```

### Backup Strategy

**Use appropriate backup mode:**
```bash
# Production: full backup and restore
npx msr-firebase migrate --backup-mode full

# Development: no backup needed
npx msr-firebase migrate --backup-mode manual
```

### Environment Separation

**Use different databases:**
```yaml
# Development
DATABASE_URL: https://dev-project.firebaseio.com

# Staging
DATABASE_URL: https://staging-project.firebaseio.com

# Production
DATABASE_URL: https://prod-project.firebaseio.com
```

**Or use shift paths:**
```bash
# Shared database with namespacing
npx msr-firebase migrate --shift development
npx msr-firebase migrate --shift staging
npx msr-firebase migrate --shift production
```

### Error Handling

**Exit codes:**
- `0` - Success
- `1` - General error
- `7` - Database connection error

**Example with error handling:**
```yaml
- name: Run migrations
  run: npx msr-firebase migrate --credentials ./key.json || exit 1

- name: Notify on failure
  if: failure()
  run: curl -X POST $SLACK_WEBHOOK -d '{"text":"Migration failed"}'
```

### Monitoring

**Log output:**
```bash
npx msr-firebase migrate --log-level debug --logger console
```

**JSON output for parsing:**
```bash
npx msr-firebase list --format json > migration-status.json
```
