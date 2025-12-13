import { IEntity, IFirebaseDB } from '../interface';
import { MigrationScript } from '@migration-script-runner/core';

export class MigrationInfo extends MigrationScript<IFirebaseDB> implements IEntity {
    key: string | undefined;
}