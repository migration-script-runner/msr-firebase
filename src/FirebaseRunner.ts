import { MigrationScriptExecutor, IMigrationExecutorDependencies, IExecutorOptions } from '@migration-script-runner/core';
import { FirebaseHandler } from './service/FirebaseHandler';
import { IFirebaseDB } from './interface';
import { FirebaseConfig } from './model/FirebaseConfig';

/**
 * Firebase Realtime Database Migration Script Runner.
 *
 * Extends MigrationScriptExecutor to provide Firebase-specific migration operations
 * with built-in support for Firebase Realtime Database features.
 *
 * **Usage:**
 * Use the static `getInstance()` factory method to create instances:
 *
 * @example
 * ```typescript
 * import { FirebaseRunner, FirebaseConfig } from '@migration-script-runner/firebase';
 *
 * const appConfig = new FirebaseConfig();
 * appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
 * appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
 * appConfig.folder = './migrations';
 * appConfig.tableName = 'schema_version';
 *
 * const runner = await FirebaseRunner.getInstance({ config: appConfig });
 * await runner.migrate();
 * ```
 */
export class FirebaseRunner extends MigrationScriptExecutor<IFirebaseDB, FirebaseHandler, FirebaseConfig> {
    private constructor(dependencies: IMigrationExecutorDependencies<IFirebaseDB, FirebaseHandler, FirebaseConfig>) {
        super(dependencies);
    }

    /**
     * Creates a new FirebaseRunner instance with automatic handler initialization.
     *
     * This is the recommended way to create a FirebaseRunner. It handles all Firebase
     * connection setup internally, providing a cleaner API for users.
     *
     * **Benefits:**
     * - Single-step initialization
     * - Handler creation is automatic and internal
     * - Cleaner, more intuitive API
     * - Properly typed configuration with Firebase-specific properties
     *
     * @param options - Firebase runner options including config and optional services
     * @returns Promise resolving to initialized FirebaseRunner instance
     *
     * @example
     * ```typescript
     * // Minimal usage
     * const runner = await FirebaseRunner.getInstance({
     *     config: appConfig
     * });
     * ```
     *
     * @example
     * ```typescript
     * // With custom logger and hooks
     * const runner = await FirebaseRunner.getInstance({
     *     config: appConfig,
     *     logger: new FileLogger('./migrations.log'),
     *     hooks: new SlackNotificationHooks(webhookUrl)
     * });
     * ```
     *
     * @example
     * ```typescript
     * // With locking enabled for production
     * const appConfig = new FirebaseConfig();
     * appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
     * appConfig.locking = {
     *     enabled: process.env.NODE_ENV === 'production',
     *     timeout: 600000
     * };
     *
     * const runner = await FirebaseRunner.getInstance({
     *     config: appConfig,
     *     metricsCollectors: [new ConsoleMetricsCollector()]
     * });
     * ```
     */
    static async getInstance(options: IExecutorOptions<IFirebaseDB, FirebaseConfig>): Promise<FirebaseRunner> {
        return MigrationScriptExecutor.createInstance(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            FirebaseRunner as any, // Required: createInstance expects public constructor, but we use private for factory pattern
            options,
            (config: FirebaseConfig) => FirebaseHandler.getInstance(config)
        );
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
