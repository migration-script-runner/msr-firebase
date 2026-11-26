---
layout: default
title: CI/CD Integration
parent: CLI Usage
nav_order: 4
---

# CI/CD Integration
{: .no_toc }

Run MSR Firebase migrations in CI and deployment pipelines with credentials kept in your platform's secret store.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## GitHub Actions

Store the service account JSON and database URL as GitHub Actions secrets. The workflow writes the JSON secret to a temporary file, uses the Firebase URL from the console, and removes the file even after a failure.

```yaml
name: Run Firebase migrations

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - name: Write service account key
        env:
          FIREBASE_SERVICE_ACCOUNT_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}
        run: printf '%s' "$FIREBASE_SERVICE_ACCOUNT_KEY" > "$RUNNER_TEMP/firebase-key.json"
      - name: Validate migrations
        env:
          DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
          GOOGLE_APPLICATION_CREDENTIALS: ${{ runner.temp }}/firebase-key.json
        run: npx msr-firebase validate
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
          GOOGLE_APPLICATION_CREDENTIALS: ${{ runner.temp }}/firebase-key.json
        run: npx msr-firebase migrate --backup-mode full
      - name: Remove service account key
        if: always()
        run: rm -f "$RUNNER_TEMP/firebase-key.json"
```

This example assumes the package is already in the application's dependencies. The current adapter requires a service-account JSON key file; the CLI does not support keyless Application Default Credentials.

## GitLab CI

Set `FIREBASE_DATABASE_URL` and `FIREBASE_SERVICE_ACCOUNT_KEY` as protected, masked CI/CD variables. Keep the service account variable as the raw JSON content.

```yaml
migrate:
  stage: deploy
  image: node:22
  before_script:
    - npm ci
    - printf '%s' "$FIREBASE_SERVICE_ACCOUNT_KEY" > "$CI_PROJECT_DIR/firebase-key.json"
    - export DATABASE_URL="$FIREBASE_DATABASE_URL"
    - export GOOGLE_APPLICATION_CREDENTIALS="$CI_PROJECT_DIR/firebase-key.json"
  script:
    - npx msr-firebase validate
    - >-
      npx msr-firebase migrate
      --backup-mode full
  after_script:
    - rm -f "$CI_PROJECT_DIR/firebase-key.json"
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
      when: manual
```

## CircleCI

Store `DATABASE_URL` and `FIREBASE_SERVICE_ACCOUNT_KEY` as CircleCI project or context environment variables. CircleCI provides `DATABASE_URL` directly to each step; the service-account JSON is written to a temporary file, and `environment` sets the path the adapter reads.

```yaml
version: 2.1

jobs:
  migrate:
    docker:
      - image: cimg/node:22.15
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Write service account key
          command: printf '%s' "$FIREBASE_SERVICE_ACCOUNT_KEY" > /tmp/firebase-key.json
      - run:
          name: Validate migrations
          command: npx msr-firebase validate
          environment:
            GOOGLE_APPLICATION_CREDENTIALS: /tmp/firebase-key.json
      - run:
          name: Run migrations
          command: npx msr-firebase migrate --backup-mode full
          environment:
            GOOGLE_APPLICATION_CREDENTIALS: /tmp/firebase-key.json
      - run:
          name: Remove service account key
          command: rm -f /tmp/firebase-key.json
          when: always

workflows:
  deploy:
    jobs:
      - migrate:
          filters:
            branches:
              only: main
```

## Docker

The container receives the database URL and a read-only mounted credential file at runtime. Do not bake service account keys into the image.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY migrations ./migrations
CMD ["sh", "-c", "npx msr-firebase migrate --backup-mode full"]
```

```bash
docker build -t msr-firebase-migrations .
docker run --rm \
  --env DATABASE_URL="$FIREBASE_DATABASE_URL" \
  --env GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase.json \
  --volume "$PWD/firebase-key.json:/run/secrets/firebase.json:ro" \
  msr-firebase-migrations
```

## Kubernetes

Create the service account key as a Kubernetes Secret and provide its mounted file path to the job. Set the database URL to the exact Realtime Database URL shown in Firebase Console; URL formats depend on the database's region.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: firebase-migrations
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrations
          image: your-registry/msr-firebase-migrations:latest
          command: ["npx", "msr-firebase", "migrate", "--backup-mode", "full"]
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
            items:
              - key: service-account.json
                path: firebase-key.json
```

## Deployment Notes

- Run `validate` before applying migrations.
- Prefer a single migration job per deployment and configure Core locking when concurrent deployments are possible.
- Keep development, staging, and production Firebase projects separate where possible.
- Use `shift` only when intentionally sharing one database between isolated environments.
- Read [Backup & Restore](../writing-migrations/backup-restore) before choosing backup modes or recovering data.
- Never print credentials or commit service account files.
