import { IMigrationScript, MigrationScript, IMigrationInfo } from '@migration-script-runner/core';
import { EntityService } from './EntityService';
import { MigrationInfo } from '../model';
import { IFirebaseDB } from '../interface';
import { database } from 'firebase-admin';

/**
 * Firebase implementation of migration script record management.
 *
 * Handles storing and retrieving migration execution metadata in Firebase Realtime Database.
 * Uses composition with EntityService for Firebase operations.
 */
export class MigrationScriptService implements IMigrationScript<IFirebaseDB> {
    private readonly entityService: EntityService<MigrationInfo>;

    constructor(public readonly db: database.Database, root: string) {
        this.entityService = new EntityService<MigrationInfo>(db, root);
    }

    /**
     * Get Firebase snapshot at a given path.
     * Used by SchemaVersionService for initialization checks.
     */
    async getSnapshot(path: string) {
        return this.db.ref(path).once('value');
    }

    /**
     * Retrieve all executed migrations from Firebase.
     *
     * @returns Promise resolving to array of executed migration records
     */
    async getAllExecuted(): Promise<MigrationScript<IFirebaseDB>[]> {
        const entities = await this.entityService.getAll();
        return entities as unknown as MigrationScript<IFirebaseDB>[];
    }

    /**
     * Save migration execution metadata to Firebase.
     *
     * @param details - Migration execution details
     */
    async save(details: IMigrationInfo): Promise<void> {
        const migrationInfo = new MigrationInfo(details.name, '', details.timestamp);
        Object.assign(migrationInfo, details);
        await this.entityService.save(migrationInfo);
    }

    /**
     * Remove migration record from Firebase by timestamp.
     *
     * @param timestamp - Migration timestamp to remove
     */
    async remove(timestamp: number): Promise<void> {
        // Find the entity with this timestamp and remove it
        const entities = await this.entityService.getAll();
        const entity = entities.find((e) => e.timestamp === timestamp);
        if (entity?.key) {
            await this.entityService.remove(entity.key);
        }
    }
}