import { ICallbackTransactionalDB } from '@migration-script-runner/core';
import { database } from 'firebase-admin';

/**
 * Firebase database interface extending MSR Core's ICallbackTransactionalDB.
 *
 * Provides type-safe access to Firebase Realtime Database operations with transaction support.
 *
 * Firebase Realtime Database uses reference-based transactions via `ref.transaction()`,
 * which differs from Firestore/MongoDB's database-level transaction objects. The transaction
 * context is the database itself, allowing migrations to call `database.ref(path).transaction()`
 * within the callback.
 *
 * @example
 * ```typescript
 * // In a migration script
 * export const up = async (db: IFirebaseDB) => {
 *   await db.runTransaction(async (database) => {
 *     const ref = database.ref('users/user1/posts');
 *     await ref.transaction((current) => {
 *       return (current || 0) + 1;
 *     });
 *   });
 * };
 * ```
 */
export interface IFirebaseDB extends ICallbackTransactionalDB<database.Database> {
    /**
     * Firebase Realtime Database instance used for all operations.
     *
     * Migrations can use this to:
     * - Get references: `database.ref(path)`
     * - Execute transactions: `database.ref(path).transaction(updateFn)`
     * - Read/write data: `database.ref(path).set()`, `database.ref(path).get()`
     */
    database: database.Database;
}
