import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { FirebaseConfig, FirebaseRunner } = require('../..');
const { BackupMode, SilentLogger } = require('@migration-script-runner/core');
const { deleteApp } = require('firebase-admin/app');

export const SMOKE_NAMESPACE = '__msr_live_smoke__';
export const MIGRATION_NAME = 'V209901010001_live_rtdb_smoke.js';
export const MIGRATION_TIMESTAMP = 209901010001;
const MARKER_PATH = 'live-smoke-marker';
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export class SmokeTestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SmokeTestError';
    }
}

export function buildSmokeShift(label, runId, runAttempt) {
    if (typeof label !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(label)) {
        throw new SmokeTestError('The shift label must use 1-40 lowercase letters, digits, underscores, or hyphens.');
    }
    if (typeof runId !== 'string' || !/^\d+$/.test(runId)) {
        throw new SmokeTestError('A valid GitHub Actions run ID is required.');
    }
    if (typeof runAttempt !== 'string' || !/^[1-9]\d*$/.test(runAttempt)) {
        throw new SmokeTestError('A valid GitHub Actions run attempt is required.');
    }

    return `${SMOKE_NAMESPACE}/${label}/${runId}/${runAttempt}`;
}

export function createSmokeConfig(env = process.env, projectRoot = PROJECT_ROOT) {
    if (!env.FIREBASE_DATABASE_URL) {
        throw new SmokeTestError('The FIREBASE_DATABASE_URL secret is not configured.');
    }
    if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new SmokeTestError('The temporary service-account file is unavailable.');
    }

    const config = new FirebaseConfig();
    config.databaseUrl = env.FIREBASE_DATABASE_URL;
    config.applicationCredentials = env.GOOGLE_APPLICATION_CREDENTIALS;
    config.folder = resolve(projectRoot, '.github/live-rtdb-smoke/migrations');
    config.shift = buildSmokeShift(env.MSR_LIVE_TEST_SHIFT, env.GITHUB_RUN_ID, env.GITHUB_RUN_ATTEMPT);
    config.backupMode = BackupMode.MANUAL;
    config.locking.enabled = false;

    return config;
}

export async function runSmokeTest({runner, expectedRunId, dispose = async () => {}}) {
    const database = runner.getDatabase();
    const {shift, tableName} = runner.getConnectionInfo();
    if (typeof shift !== 'string' || !shift.startsWith(`${SMOKE_NAMESPACE}/`)) {
        throw new SmokeTestError('Refusing to write outside the dedicated smoke-test namespace.');
    }

    const shiftRef = database.ref(shift);
    let ownsShift = false;
    const failures = [];

    try {
        const currentData = await shiftRef.once('value');
        if (currentData.exists()) {
            throw new SmokeTestError('Refusing to run because the generated shift already contains data.');
        }
        ownsShift = true;

        const result = await runner.migrate();
        if (!result?.success) {
            throw new SmokeTestError('The smoke migration did not complete successfully.');
        }

        const markerSnapshot = await database.ref(`${shift}/${MARKER_PATH}`).once('value');
        if (!markerSnapshot.exists() || markerSnapshot.val()?.runId !== expectedRunId) {
            throw new SmokeTestError('The smoke migration marker could not be verified.');
        }

        const schemaSnapshot = await database.ref(`${shift}/${tableName}`).once('value');
        const records = schemaSnapshot.val();
        const migrationRecorded = records && typeof records === 'object'
            && Object.values(records).some(record => record?.name === MIGRATION_NAME
                && Number(record.timestamp) === MIGRATION_TIMESTAMP);
        if (!schemaSnapshot.exists() || !migrationRecorded) {
            throw new SmokeTestError('The schema-version record could not be verified.');
        }
    } catch (error) {
        failures.push(error instanceof SmokeTestError
            ? error
            : new SmokeTestError('The live smoke test failed; detailed error output is suppressed.'));
    }

    if (ownsShift) {
        try {
            await shiftRef.remove();
        } catch {
            failures.push(new SmokeTestError('Could not remove the generated shift; manual cleanup may be needed.'));
        }
    }

    try {
        await dispose(database.app);
    } catch {
        failures.push(new SmokeTestError('Could not close the Firebase connection cleanly.'));
    }

    if (failures.length === 1) {
        throw failures[0];
    }
    if (failures.length > 1) {
        throw new SmokeTestError(failures.map(failure => failure.message).join(' '));
    }
}

async function main() {
    let runner;
    try {
        const config = createSmokeConfig();
        runner = await FirebaseRunner.getInstance({
            config,
            logger: new SilentLogger(),
        });
        await runSmokeTest({
            runner,
            expectedRunId: process.env.GITHUB_RUN_ID,
            dispose: app => deleteApp(app),
        });
        console.log('Live RTDB smoke test passed; the run-specific shift was removed.');
    } catch (error) {
        const message = error instanceof SmokeTestError
            ? error.message
            : 'The live RTDB smoke test failed; sensitive error details are suppressed.';
        console.error(message);
        process.exitCode = 1;
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await main();
}
