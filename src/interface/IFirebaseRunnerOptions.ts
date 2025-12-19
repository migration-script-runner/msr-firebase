import { IExecutorOptions } from '@migration-script-runner/core';
import { IFirebaseDB } from './IFirebaseDB';
import { AppConfig } from '../model/AppConfig';

/**
 * Options for FirebaseRunner initialization.
 *
 * Extends IExecutorOptions with Firebase-specific configuration type.
 * This interface overrides the base `config` property to use `AppConfig`
 * instead of the base `Config` type, providing type safety for Firebase-specific
 * configuration properties like `databaseUrl`, `applicationCredentials`, and `shift`.
 *
 * **Temporary Interface:**
 * This is a temporary workaround until MSR Core v0.9+ supports generic config types
 * in `IExecutorOptions`. Once the upstream issue is resolved, this interface will
 * be deprecated and removed.
 *
 * @see https://github.com/migration-script-runner/msr-core/issues/144 - Generic config support
 * @see https://github.com/migration-script-runner/msr-core/issues/147 - Base factory pattern
 * @see https://github.com/migration-script-runner/msr-firebase/issues/68 - getInstance() API
 *
 * @example
 * ```typescript
 * import { FirebaseRunner, AppConfig } from '@migration-script-runner/firebase';
 *
 * const appConfig = new AppConfig();
 * appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
 * appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
 * appConfig.tableName = 'schema_version';
 *
 * const runner = await FirebaseRunner.getInstance({
 *     config: appConfig,
 *     logger: new FileLogger('./migrations.log'),
 *     hooks: new SlackNotificationHooks()
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With minimal config
 * const runner = await FirebaseRunner.getInstance({
 *     config: appConfig
 * });
 *
 * await runner.migrate();
 * ```
 *
 * @example
 * ```typescript
 * // With locking enabled
 * const appConfig = new AppConfig();
 * appConfig.databaseUrl = process.env.FIREBASE_DATABASE_URL;
 * appConfig.locking = {
 *     enabled: true,
 *     timeout: 600000
 * };
 *
 * const runner = await FirebaseRunner.getInstance({
 *     config: appConfig
 * });
 * ```
 */
export interface IFirebaseRunnerOptions extends IExecutorOptions<IFirebaseDB> {
    /**
     * Firebase application configuration (REQUIRED).
     *
     * Overrides the base `config?: Config` from IExecutorOptions to:
     * 1. Make it required (removes the `?` optional modifier)
     * 2. Use the Firebase-specific `AppConfig` type
     *
     * AppConfig extends Config with Firebase-specific properties:
     * - `databaseUrl` - Firebase Realtime Database URL
     * - `applicationCredentials` - Path to service account key
     * - `shift` - Optional path prefix for all database operations
     *
     * @example
     * ```typescript
     * const appConfig = new AppConfig();
     * appConfig.databaseUrl = 'https://my-project.firebaseio.com';
     * appConfig.applicationCredentials = './serviceAccountKey.json';
     * appConfig.tableName = 'schema_version';
     * appConfig.folder = './migrations';
     * appConfig.shift = '/development';  // Optional namespace
     * ```
     */
    config: AppConfig;
}
