import { Config, TransactionMode } from '@migration-script-runner/core';

export class FirebaseConfig extends Config {
    applicationCredentials: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    databaseUrl: string | undefined = process.env.DATABASE_URL;

    shift: string | undefined;

    /**
     * Relative Firebase database paths included in automatic migration backups.
     * Omit this option to preserve full-database backup behavior.
     */
    backupPaths: string[] | undefined;

    tableName: string = 'schema_version';

    constructor() {
        super();
        // Firebase Realtime Database does not support database-wide transactions
        // Only single-node atomic operations via ref.transaction() are supported
        this.transaction.mode = TransactionMode.NONE;
    }

    public getRoot() {
        return this.buildPath('');
    }

    public buildPath(path: string) {
        return `${this.shift}/${path}`;
    }
}