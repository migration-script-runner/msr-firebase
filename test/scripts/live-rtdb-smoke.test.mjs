import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {
    buildSmokeShift,
    createSmokeConfig,
    MIGRATION_NAME,
    MIGRATION_TIMESTAMP,
    runSmokeTest,
    SMOKE_NAMESPACE,
    SmokeTestError,
} from '../../.github/scripts/live-rtdb-smoke.mjs';

function createFakeRunner({occupied = false, migrationSuccess = true, markerRunId = '12345', schemaRecord = true} = {}) {
    const state = {migrateCalls: 0, removeCalls: 0, disposeCalls: 0};
    const shift = `${SMOKE_NAMESPACE}/test-label/12345/1`;
    const tableName = 'schema_version';
    const database = {
        app: {name: 'fake-app'},
        ref(path) {
            return {
                async once() {
                    if (path === shift) {
                        return {exists: () => occupied, val: () => (occupied ? {existing: true} : null)};
                    }
                    if (path === `${shift}/live-smoke-marker`) {
                        return {exists: () => markerRunId !== null, val: () => ({runId: markerRunId})};
                    }
                    if (path === `${shift}/${tableName}`) {
                        const records = schemaRecord
                            ? {[MIGRATION_NAME]: {name: MIGRATION_NAME, timestamp: MIGRATION_TIMESTAMP}}
                            : {};
                        return {exists: () => schemaRecord, val: () => records};
                    }
                    throw new Error('Unexpected database path');
                },
                async remove() {
                    if (path === shift) state.removeCalls += 1;
                },
            };
        },
    };
    const runner = {
        getDatabase: () => database,
        getConnectionInfo: () => ({shift, tableName}),
        async migrate() {
            state.migrateCalls += 1;
            return {success: migrationSuccess};
        },
    };
    const dispose = async app => {
        assert.equal(app, database.app);
        state.disposeCalls += 1;
    };
    return {runner, state, dispose};
}

test('buildSmokeShift creates a namespaced path unique to the GitHub run attempt', () => {
    assert.equal(buildSmokeShift('manual-1', '12345', '1'), '__msr_live_smoke__/manual-1/12345/1');
    assert.notEqual(buildSmokeShift('manual-1', '12345', '2'), buildSmokeShift('manual-1', '12345', '1'));
});

test('buildSmokeShift rejects empty, unsafe, or non-namespaced input', () => {
    for (const label of ['', '../root', 'one/two', 'UpperCase', 'a'.repeat(41)]) {
        assert.throws(() => buildSmokeShift(label, '12345', '1'), SmokeTestError);
    }
    assert.throws(() => buildSmokeShift('safe-label', 'not-a-run-id', '1'), SmokeTestError);
    assert.throws(() => buildSmokeShift('safe-label', '12345', '0'), SmokeTestError);
});

test('createSmokeConfig requires both secrets and configures manual backup under its dedicated migration folder', () => {
    assert.throws(() => createSmokeConfig({}), /FIREBASE_DATABASE_URL/);
    assert.throws(() => createSmokeConfig({FIREBASE_DATABASE_URL: 'https://test.firebaseio.com'}), /service-account file/);

    const config = createSmokeConfig({
        FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
        GOOGLE_APPLICATION_CREDENTIALS: '/tmp/firebase-key.json',
        MSR_LIVE_TEST_SHIFT: 'manual-1',
        GITHUB_RUN_ID: '12345',
        GITHUB_RUN_ATTEMPT: '1',
    }, '/repo');
    assert.equal(config.backupMode, 'manual');
    assert.equal(config.shift, '__msr_live_smoke__/manual-1/12345/1');
    assert.equal(config.folder, '/repo/.github/live-rtdb-smoke/migrations');
    assert.equal(config.locking.enabled, false);
});

test('fixture name matches the schema record the smoke test verifies', async () => {
    const fixture = await readFile(new URL('../../.github/live-rtdb-smoke/migrations/V209901010001_live_rtdb_smoke.js', import.meta.url), 'utf8');
    assert.equal(MIGRATION_NAME, 'V209901010001_live_rtdb_smoke.js');
    assert.match(fixture, /live-smoke-marker/);
});

test('PR-triggered workflows check out master instead of the pull request branch', async () => {
    const workflowNames = ['docs', 'pr-validation', 'security', 'test', 'live-rtdb-smoke'];
    for (const workflowName of workflowNames) {
        const workflowSource = await readFile(new URL(`../../.github/workflows/${workflowName}.yml`, import.meta.url), 'utf8');
        assert.match(workflowSource, /uses: actions\/checkout@v4[\s\S]*?with:\n\s+ref: master/);
    }

    const liveWorkflow = await readFile(new URL('../../.github/workflows/live-rtdb-smoke.yml', import.meta.url), 'utf8');
    assert.match(liveWorkflow, /pull_request_target:\n\s+branches:\n\s+- master/);
    assert.match(liveWorkflow, /types:\n\s+- opened\n\s+- edited\n\s+- synchronize\n\s+- reopened/);
    assert.match(liveWorkflow, /date -u '\+%Y%m%dt%H%M%S'/);
});

test('runSmokeTest refuses a populated shift without migrating or removing it', async () => {
    const fake = createFakeRunner({occupied: true});
    await assert.rejects(runSmokeTest({runner: fake.runner, expectedRunId: '12345', dispose: fake.dispose}), /already contains data/);
    assert.equal(fake.state.migrateCalls, 0);
    assert.equal(fake.state.removeCalls, 0);
    assert.equal(fake.state.disposeCalls, 1);
});

test('runSmokeTest verifies migration and schema record, then removes only the owned shift', async () => {
    const fake = createFakeRunner();
    await runSmokeTest({runner: fake.runner, expectedRunId: '12345', dispose: fake.dispose});
    assert.equal(fake.state.migrateCalls, 1);
    assert.equal(fake.state.removeCalls, 1);
    assert.equal(fake.state.disposeCalls, 1);
});

test('runSmokeTest removes the owned shift after migration or verification failures', async t => {
    await t.test('migration failure', async () => {
        const fake = createFakeRunner({migrationSuccess: false});
        await assert.rejects(runSmokeTest({runner: fake.runner, expectedRunId: '12345', dispose: fake.dispose}), /did not complete successfully/);
        assert.equal(fake.state.removeCalls, 1);
        assert.equal(fake.state.disposeCalls, 1);
    });
    await t.test('marker verification failure', async () => {
        const fake = createFakeRunner({markerRunId: 'different-run'});
        await assert.rejects(runSmokeTest({runner: fake.runner, expectedRunId: '12345', dispose: fake.dispose}), /marker could not be verified/);
        assert.equal(fake.state.removeCalls, 1);
        assert.equal(fake.state.disposeCalls, 1);
    });
    await t.test('schema-version verification failure', async () => {
        const fake = createFakeRunner({schemaRecord: false});
        await assert.rejects(runSmokeTest({runner: fake.runner, expectedRunId: '12345', dispose: fake.dispose}), /schema-version record could not be verified/);
        assert.equal(fake.state.removeCalls, 1);
        assert.equal(fake.state.disposeCalls, 1);
    });
});
