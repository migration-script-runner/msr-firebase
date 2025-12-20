import { IBackupService } from '@migration-script-runner/core';
import { database } from 'firebase-admin';

/**
 * Firebase Realtime Database backup service.
 *
 * Implements content-based backup by serializing Firebase data to JSON.
 * Supports backing up all nodes or specific filtered nodes.
 */
export class BackupService implements IBackupService {
    static NODES = {
        ALL: ['/'],
        SELECTED: [
            // FILTERED NODES HERE
        ]
    };

    private lastBackup?: string;

    constructor(
        private db: database.Database,
        private nodes = BackupService.NODES.ALL
    ) {}

    private async getData(): Promise<Record<string, unknown>> {
        const data = await Promise.all(this.nodes.map(node => this.db.ref(node).once('value')));
        const obj: Record<string, unknown> = {};
        return this.nodes.reduce((acc, name, index) => {
            acc[name] = data[index].val();
            return acc;
        }, obj);
    }

    private async saveData(data: Record<string, unknown>): Promise<void> {
        const tasks = Object.keys(data).map((node: string) => {
            const ref = this.db.ref(node);
            const value = data[node];
            return ref.set(value);
        });
        await Promise.all(tasks);
    }

    /**
     * Creates a backup of Firebase Realtime Database.
     *
     * @returns Promise resolving to serialized JSON backup content
     */
    async backup(): Promise<string> {
        const data = await this.getData();
        this.lastBackup = JSON.stringify(data, null, '  ');
        return this.lastBackup;
    }

    /**
     * Restores Firebase Realtime Database from backup.
     *
     * @param backupPath - Optional backup content (JSON string). If not provided, uses last backup.
     * @throws Error if no backup data available
     */
    async restore(backupPath?: string): Promise<void> {
        const backupData = backupPath ?? this.lastBackup;
        if (!backupData) {
            throw new Error('No backup data available to restore');
        }
        await this.saveData(JSON.parse(backupData));
    }

    /**
     * Clears the stored backup data from memory.
     */
    deleteBackup(): void {
        this.lastBackup = undefined;
    }
}