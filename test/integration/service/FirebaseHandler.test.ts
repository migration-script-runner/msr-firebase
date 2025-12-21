import { expect, spy } from 'chai';
import sinon from 'sinon';
import { afterEach, after } from 'mocha';
import { MigrationScriptExecutor } from '@migration-script-runner/core';

import { FirebaseHandler, IFirebaseDB } from '../../../src';
import { IntegrationTestConfig } from '../../IntegrationTestConfig';

let processExit = sinon.stub(process, 'exit');

describe('FirebaseHandler', () => {
    let handler: FirebaseHandler;

    afterEach(async () => {
        spy.restore();
        if (handler) {
            await handler.db.database.ref(handler.cfg.shift!).remove();
        }
    });

    after(async () => {
        processExit.restore();
    });

    it('init', async () => {
        // having
        handler = await FirebaseHandler.getInstance(new IntegrationTestConfig());

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
        handler = await FirebaseHandler.getInstance(new IntegrationTestConfig());

        // when
        spy.on(handler, ['getName']);
        spy.on(handler.schemaVersion, ['isInitialized', 'createTable', 'validateTable']);
        spy.on(handler.schemaVersion.migrationRecords, ['save', 'getAllExecuted']);
        await new MigrationScriptExecutor<IFirebaseDB>({ handler }).up();

        // then
        expect(handler.getName).have.been.called.once;
        expect(handler.schemaVersion.isInitialized).have.been.called.once;
        expect(handler.schemaVersion.createTable).have.been.called.once;
        expect(handler.schemaVersion.validateTable).have.been.called.once;
        expect(handler.schemaVersion.migrationRecords.save).have.not.been.called;
        expect(handler.schemaVersion.migrationRecords.getAllExecuted).have.not.been.called;

        // and: verify handler is functional
        expect(handler.db).not.undefined;
        expect(handler.backup).not.undefined;
        expect(handler.schemaVersion).not.undefined;
    });

});