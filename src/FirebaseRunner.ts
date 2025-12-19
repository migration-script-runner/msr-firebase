import { MigrationScriptExecutor, Config } from '@migration-script-runner/core';
import { FirebaseHandler } from './service/FirebaseHandler';
import { IFirebaseDB } from './interface';

/**
 * Firebase Realtime Database Migration Script Runner.
 *
 * Extends MigrationScriptExecutor to provide CLI integration for Firebase Realtime Database.
 * Supports all standard migration operations plus Firebase-specific commands.
 *
 * @example
 * ```typescript
 * const handler = await FirebaseHandler.getInstance(config);
 * const runner = new FirebaseRunner({handler, config});
 *
 * await runner.migrate();
 * ```
 */
export class FirebaseRunner extends MigrationScriptExecutor<IFirebaseDB, FirebaseHandler> {
    constructor({ handler, config }: { handler: FirebaseHandler; config: Config }) {
        super({ handler, config });
    }

    /**
     * Gets Firebase connection information.
     *
     * @returns Connection details including database URL and shift path
     */
    getConnectionInfo(): { databaseUrl?: string; shift?: string; tableName: string } {
        return {
            databaseUrl: this.handler.cfg.databaseUrl,
            shift: this.handler.cfg.shift,
            tableName: this.handler.cfg.tableName,
        };
    }

    /**
     * Gets Firebase database reference for the configured shift path.
     *
     * @returns Firebase database reference
     */
    getDatabase() {
        return this.handler.db.database;
    }

    /**
     * Lists all root nodes in the Firebase database.
     *
     * @returns Array of root node names
     *
     * @example
     * ```typescript
     * const nodes = await runner.listNodes();
     * console.log('Root nodes:', nodes);
     * ```
     */
    async listNodes(): Promise<string[]> {
        const root = this.handler.cfg.shift || '/';
        const snapshot = await this.handler.db.database.ref(root).once('value');

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        if (typeof data !== 'object' || data === null) {
            return [];
        }

        return Object.keys(data);
    }

    /**
     * Backs up specific nodes from the Firebase database.
     *
     * @param nodes - Array of node paths to backup (relative to shift path)
     * @returns Object mapping node paths to their data
     *
     * @example
     * ```typescript
     * const backup = await runner.backupNodes(['users', 'posts']);
     * console.log('Backed up:', backup);
     * ```
     */
    async backupNodes(nodes: string[]): Promise<Record<string, unknown>> {
        const backup: Record<string, unknown> = {};

        for (const node of nodes) {
            const path = this.handler.cfg.buildPath(node);
            const snapshot = await this.handler.db.database.ref(path).once('value');

            if (snapshot.exists()) {
                backup[node] = snapshot.val();
            } else {
                backup[node] = null;
            }
        }

        return backup;
    }
}
