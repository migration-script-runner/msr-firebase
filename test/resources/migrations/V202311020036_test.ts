import { IMigrationInfo, IRunnableScript } from '@migration-script-runner/core';
import { EntityService, FirebaseHandler, IFirebaseDB } from '../../../src';
import { TestEntity } from '../../TestEntity';

export class Script implements IRunnableScript<IFirebaseDB> {
    async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const a = new TestEntity('test-case-1');
        const testService = new EntityService(db.database, handler.cfg.buildPath('test-case-1'));
        const key = await testService.save(a);

        const list = await testService.getAll();
        console.log(list);

        return Promise.resolve(key);
    }
}