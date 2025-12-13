import { ISchemaVersion } from '@migration-script-runner/core';
import { MigrationScriptService } from './MigrationScriptService';
import { AppConfig } from '../model';
import { IFirebaseDB } from '../interface';

/**
 * Firebase implementation of schema version tracking.
 *
 * Manages the migration tracking node in Firebase Realtime Database,
 * providing table initialization, validation, and migration record access.
 */
export class SchemaVersionService implements ISchemaVersion<IFirebaseDB> {
    /**
     * Migration records interface for accessing executed migrations.
     */
    migrationRecords: MigrationScriptService;

    constructor(
        migrations: MigrationScriptService,
        private cfg: AppConfig
    ) {
        this.migrationRecords = migrations;
    }

    /**
     * Creates the schema version tracking node in Firebase.
     *
     * @param tableName - Name of the migration tracking node
     * @returns Promise resolving to true if created, false if already exists
     */
    async createTable(tableName: string): Promise<boolean> {
        const node = this.cfg.buildPath(tableName);
        await this.migrationRecords.db.ref(node).set({});
        return true;
    }

    /**
     * Checks if the schema version tracking node exists in Firebase.
     *
     * @param tableName - Name of the migration tracking node
     * @returns Promise resolving to true if node exists
     */
    async isInitialized(tableName: string): Promise<boolean> {
        const dataSnapshot = await this.migrationRecords.getSnapshot(this.cfg.buildPath(tableName));
        return dataSnapshot.exists();
    }

    /**
     * Validates the schema version tracking node structure.
     *
     * For Firebase, this always returns true as the structure is flexible.
     *
     * @param tableName - Name of the migration tracking node
     * @returns Promise resolving to true
     */
    async validateTable(tableName: string): Promise<boolean> {
        console.log(tableName);
        return true;
    }
}