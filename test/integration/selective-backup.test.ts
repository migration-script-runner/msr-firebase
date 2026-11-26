import { expect } from 'chai';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { Database } from 'firebase-admin/database';
import { join } from 'node:path';
import { BackupMode, RollbackStrategy, SilentLogger } from '@migration-script-runner/core';
import { FirebaseConfig, FirebaseRunner } from '../../src';
import { DBConnector } from '../../src/service/DBConnector';
import { IntegrationTestConfig } from '../IntegrationTestConfig';

describe('Selective automatic backup integration', () => {
    const baseConfig = new IntegrationTestConfig();
    const testRoot = `selective-backup-${Date.now()}`;
    let migrationFolder: string;
    let database: Database;
    let runner: FirebaseRunner;

    before(async () => {
        migrationFolder = await mkdtemp(join(process.cwd(), 'test/.tmp-msr-firebase-selective-backup-'));
    });

    after(async () => {
        if (database) {
            await database.ref(baseConfig.shift!).remove();
            await database.app.delete();
        }
        if (runner) {
            await runner.getHandler().db.database.app.delete();
        }
        if (migrationFolder) {
            await rm(migrationFolder, { recursive: true, force: true });
        }
    });

    it('restores selected paths after a failed migration and preserves data outside them', async function () {
        this.timeout(30000);
        const config = new FirebaseConfig();
        Object.assign(config, baseConfig);
        config.folder = migrationFolder;
        config.backupPaths = [`${testRoot}/selected`, `${testRoot}/missing`];
        config.rollbackStrategy = RollbackStrategy.BACKUP;
        config.backupMode = BackupMode.FULL;

        database = DBConnector.connect(config);
        const selectedPath = config.buildPath(`${testRoot}/selected`);
        const missingPath = config.buildPath(`${testRoot}/missing`);
        const outsidePath = config.buildPath(`${testRoot}/outside`);

        await database.ref(selectedPath).set({ value: 'before' });
        await database.ref(outsidePath).set({ value: 'before' });

        const migrationSource = [
            "Object.defineProperty(exports, '__esModule', { value: true });",
            'exports.Script = class {',
            '  async up(db) {',
            `    await db.database.ref(${JSON.stringify(selectedPath)}).set({ value: 'after' });`,
            `    await db.database.ref(${JSON.stringify(missingPath)}).set({ created: true });`,
            `    await db.database.ref(${JSON.stringify(outsidePath)}).set({ value: 'changed outside selection' });`,
            "    throw new Error('intentional migration failure');",
            '  }',
            '};',
            ''
        ].join('\n');
        await writeFile(join(migrationFolder, 'V209912312359_selective_backup_failure.js'), migrationSource);

        runner = await FirebaseRunner.getInstance({ config, logger: new SilentLogger() });
        const result = await runner.up();

        expect(result.success).to.equal(false);
        expect(result.errors?.map(error => error instanceof Error ? error.message : String(error)).join(' '))
            .to.contain('intentional migration failure');
        expect((await database.ref(selectedPath).once('value')).val()).to.deep.equal({ value: 'before' });
        expect((await database.ref(missingPath).once('value')).exists()).to.equal(false);
        expect((await database.ref(outsidePath).once('value')).val())
            .to.deep.equal({ value: 'changed outside selection' });
    });
});
