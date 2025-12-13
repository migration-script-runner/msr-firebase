import { expect, spy } from 'chai';
import sinon from 'sinon';
import { afterEach, after } from 'mocha';
import { MigrationScriptExecutor } from '@migration-script-runner/core';

import { EntityService, FirebaseHandler, IFirebaseDB } from '../../../src';
import { TestConfig, TestUtils, TestEntity } from '../../index';

let processExit = sinon.stub(process, 'exit');

describe('FirebaseHandler', () => {

    afterEach(async () => {
        spy.restore();
        await TestUtils.clean();
    });

    after(async () => {
        processExit.restore();
    });

    it('init', async () => {
        // having
        const handler = await FirebaseHandler.getInstance(new TestConfig());

        // when
        spy.on(handler, ['getName']);
        spy.on(handler.schemaVersion, ['isInitialized', 'createTable', 'validateTable']);
        spy.on(handler.schemaVersion.migrationRecords, ['save', 'getAllExecuted']);
        new MigrationScriptExecutor<IFirebaseDB>({ handler });

        // then
        expect(handler.getName).have.been.called.once;
        expect(handler.schemaVersion.isInitialized).have.not.been.called;
        expect(handler.schemaVersion.createTable).have.not.been.called;
        expect(handler.schemaVersion.validateTable).have.not.been.called;
        expect(handler.schemaVersion.migrationRecords.save).have.not.been.called;
        expect(handler.schemaVersion.migrationRecords.getAllExecuted).have.not.been.called;
    });

    it('golden path', async () => {
        // having
        const handler = await FirebaseHandler.getInstance(new TestConfig());

        // when
        spy.on(handler, ['getName']);
        spy.on(handler.backup, ['backup']);
        spy.on(handler.schemaVersion, ['isInitialized', 'createTable', 'validateTable']);
        spy.on(handler.schemaVersion.migrationRecords, ['save', 'getAllExecuted']);
        await new MigrationScriptExecutor<IFirebaseDB>({ handler }).up();

        // then
        expect(handler.getName).have.been.called.once;
        expect(handler.backup.backup).have.been.called.once;
        expect(handler.schemaVersion.isInitialized).have.been.called.once;
        expect(handler.schemaVersion.createTable).have.been.called.once;
        expect(handler.schemaVersion.validateTable).have.been.called.once;
        expect(handler.schemaVersion.migrationRecords.save).have.not.been.called;
        expect(handler.schemaVersion.migrationRecords.getAllExecuted).have.not.been.called;

        // and
        const testService = new EntityService<TestEntity>(handler.db.database, handler.cfg.buildPath('test-case-1'));
        const records = await testService.getAll();
        expect(records.length).eq(1, 'Should be one records in test-case-1 table');

        const record = records[0];
        expect(record.hasOwnProperty('test'), 'Should have test prop').is.true;
        expect((record as TestEntity).test).eq('test-case-1', 'The customField prop should have test-case-1 as a value');
    });

});