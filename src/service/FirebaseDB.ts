import { database } from 'firebase-admin';
import { IFirebaseDB } from '../interface';

/**
 * Firebase Realtime Database implementation of IFirebaseDB.
 *
 * Wraps the firebase-admin database instance and provides connection checking.
 *
 * **Transaction Note:** Firebase Realtime Database does not support database-wide
 * transactions. Use `database.ref(path).transaction()` for single-node atomic operations.
 *
 * @example
 * ```typescript
 * const firebaseDb = new FirebaseDB(database);
 * await firebaseDb.checkConnection();
 *
 * // Single-node atomic transaction
 * const ref = firebaseDb.database.ref('counters/posts');
 * await ref.transaction((current) => (current || 0) + 1);
 * ```
 */
export class FirebaseDB implements IFirebaseDB {
    [key: string]: unknown;

    /**
     * Creates a new FirebaseDB instance.
     *
     * @param database - Firebase Realtime Database instance from firebase-admin
     */
    constructor(public readonly database: database.Database) {}

    /**
     * Checks the connection to Firebase Realtime Database.
     *
     * Tests connectivity by reading the special `.info/connected` path,
     * which is always available and indicates connection status.
     *
     * @returns Promise resolving to true if connected, false otherwise
     */
    async checkConnection(): Promise<boolean> {
        try {
            await this.database.ref('.info/connected').once('value');
            return true;
        } catch {
            return false;
        }
    }
}
