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
export class FirebaseRunner extends MigrationScriptExecutor<IFirebaseDB> {
    constructor({ handler, config }: { handler: FirebaseHandler; config: Config }) {
        super({ handler, config });
    }

    /**
     * Gets Firebase connection information.
     *
     * @returns Connection details including database URL and shift path
     */
    getConnectionInfo(): { databaseUrl?: string; shift?: string; tableName: string } {
        const handler = this.getHandler() as FirebaseHandler;
        return {
            databaseUrl: handler.cfg.databaseUrl,
            shift: handler.cfg.shift,
            tableName: handler.cfg.tableName,
        };
    }

    /**
     * Gets Firebase database reference for the configured shift path.
     *
     * @returns Firebase database reference
     */
    getDatabase() {
        const handler = this.getHandler();
        return handler.db.database;
    }

    /**
     * Gets the Firebase handler instance.
     *
     * @returns FirebaseHandler instance
     */
    private getHandler(): FirebaseHandler {
        return this['handler'] as FirebaseHandler;
    }
}
