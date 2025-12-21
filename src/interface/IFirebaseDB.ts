import { IDB } from '@migration-script-runner/core';
import { database } from 'firebase-admin';

/**
 * Firebase database interface for MSR migrations.
 *
 * Provides type-safe access to Firebase Realtime Database operations.
 *
 * **Important: Transaction Limitations**
 *
 * Firebase Realtime Database does NOT support database-wide transactions like SQL databases.
 * Instead, Firebase provides single-node atomic operations via `ref.transaction()`.
 *
 * See [Firebase Transactions Guide](https://migration-script-runner.github.io/msr-firebase/guides/transactions)
 * for proper usage patterns and examples.
 *
 * @example
 * ```typescript
 * // Single-node atomic transaction (CORRECT usage)
 * export default class IncrementCounter implements IRunnableScript<IFirebaseDB> {
 *   async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler) {
 *     const ref = db.database.ref(handler.cfg.buildPath('counters/posts'));
 *     await ref.transaction((current) => (current || 0) + 1);
 *     return 'Incremented post counter';
 *   }
 * }
 * ```
 */
export interface IFirebaseDB extends IDB {
    /**
     * Firebase Realtime Database instance used for all operations.
     *
     * Migrations can use this to:
     * - Get references: `database.ref(path)`
     * - Execute single-node transactions: `database.ref(path).transaction(updateFn)`
     * - Read/write data: `database.ref(path).set()`, `database.ref(path).once()`
     *
     * @see https://firebase.google.com/docs/database/web/read-and-write
     * @see https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions
     */
    database: database.Database;
}
