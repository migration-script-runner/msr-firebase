import { IDatabaseMigrationHandler, IBackupService, ISchemaVersionService } from '@migration-script-runner/core';
import { version } from '../../package.json';

import {
    AppConfig,
    BackupService,
    SchemaVersionService,
    MigrationScriptService,
    DBConnector,
    FirebaseDB
} from '../index';
import { IFirebaseDB } from '../interface';

/**
 * Firebase Realtime Database migration handler.
 *
 * Implements MSR Core's IDatabaseMigrationHandler interface for Firebase Realtime Database,
 * providing migration execution, schema versioning, and backup capabilities.
 */
export class FirebaseHandler implements IDatabaseMigrationHandler<IFirebaseDB> {
    db: IFirebaseDB;
    backup: IBackupService;
    schemaVersion: ISchemaVersionService<IFirebaseDB>;

    private constructor(
        public cfg: AppConfig,
        firebaseDatabase: FirebaseDB
    ) {
        this.db = firebaseDatabase;
        this.backup = new BackupService(firebaseDatabase.database);
        const mss = new MigrationScriptService(firebaseDatabase.database, this.cfg.buildPath(this.cfg.tableName));
        this.schemaVersion = new SchemaVersionService(mss, cfg);
    }

    /**
     * Creates a new FirebaseHandler instance.
     *
     * Connects to Firebase Realtime Database using the provided configuration
     * and initializes all required services.
     *
     * @param cfg - Application configuration
     * @returns Promise resolving to configured FirebaseHandler
     */
    public static async getInstance(cfg: AppConfig): Promise<FirebaseHandler> {
        const database = await DBConnector.connect(cfg);
        const firebaseDb = new FirebaseDB(database);
        return new FirebaseHandler(cfg, firebaseDb);
    }

    getName = () => 'Firebase Realtime Database Handler';

    getVersion = () => version;
}