import { IDatabaseMigrationHandler, IBackup, ISchemaVersion, ILockingProvider } from '@migration-script-runner/core';
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
import { resolveBackupPaths } from './backupPaths';

/**
 * Firebase Realtime Database migration handler.
 *
 * Implements MSR Core's IDatabaseMigrationHandler interface for Firebase Realtime Database,
 * providing migration execution, schema versioning, and backup capabilities.
 */
export class FirebaseHandler implements IDatabaseMigrationHandler<IFirebaseDB> {
    readonly db: IFirebaseDB;
    readonly backup: IBackup<IFirebaseDB>;
    readonly schemaVersion: ISchemaVersion<IFirebaseDB>;
    readonly lockingProvider?: ILockingProvider<IFirebaseDB>;

    private constructor(
        public readonly cfg: FirebaseConfig,
        firebaseDatabase: FirebaseDB,
        backupPaths?: string[]
    ) {
        this.db = firebaseDatabase;
        this.backup = new BackupService(firebaseDatabase.database, backupPaths);
        const mss = new MigrationScriptService(firebaseDatabase.database, this.cfg.buildPath(this.cfg.tableName));
        this.schemaVersion = new SchemaVersionService(mss, cfg);

        // Initialize the locking provider if locking is enabled in config
        if (cfg.locking.enabled) {
            this.lockingProvider = new FirebaseLockingService(
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
        const backupPaths = resolveBackupPaths(cfg.backupPaths, cfg.shift);
        const database = DBConnector.connect(cfg);
        const firebaseDb = new FirebaseDB(database);
        const handler = new FirebaseHandler(cfg, firebaseDb, backupPaths);

        // Initialize lock storage if locking is enabled
        if (handler.lockingProvider) {
            await handler.lockingProvider.initLockStorage();
        }

        return handler;
    }

    getName = () => 'Firebase Realtime Database Runner';

    getVersion = () => version;
}
