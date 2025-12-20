import { IDatabaseMigrationHandler, IBackupService, ISchemaVersion, ILockingService } from '@migration-script-runner/core';
import { version } from '../../package.json';

import {
    FirebaseConfig,
    BackupService,
    SchemaVersionService,
    MigrationScriptService,
    DBConnector,
    FirebaseDB,
    FirebaseLockingService
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
    schemaVersion: ISchemaVersion<IFirebaseDB>;
    lockingService?: ILockingService<IFirebaseDB>;

    private constructor(
        public cfg: FirebaseConfig,
        firebaseDatabase: FirebaseDB
    ) {
        this.db = firebaseDatabase;
        this.backup = new BackupService(firebaseDatabase.database);
        const mss = new MigrationScriptService(firebaseDatabase.database, this.cfg.buildPath(this.cfg.tableName));
        this.schemaVersion = new SchemaVersionService(mss, cfg);

        // Initialize locking service if locking is enabled in config
        if (cfg.locking?.enabled) {
            this.lockingService = new FirebaseLockingService(
                firebaseDatabase,
                cfg.locking,
                cfg.shift
            );
        }
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
    public static async getInstance(cfg: FirebaseConfig): Promise<FirebaseHandler> {
        const database = await DBConnector.connect(cfg);
        const firebaseDb = new FirebaseDB(database);
        const handler = new FirebaseHandler(cfg, firebaseDb);

        // Initialize lock storage if locking is enabled
        if (handler.lockingService && 'initLockStorage' in handler.lockingService) {
            await (handler.lockingService as FirebaseLockingService).initLockStorage();
        }

        return handler;
    }

    getName = () => 'Firebase Realtime Database Runner';

    getVersion = () => version;
}