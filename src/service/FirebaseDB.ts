import { database } from 'firebase-admin';
import { IFirebaseDB } from '../interface';

/**
 * Firebase Realtime Database implementation of IFirebaseDB.
 *
 * Wraps the firebase-admin database instance and provides MSR Core-compatible
 * transaction support through the ICallbackTransactionalDB interface.
 *
 * @example
 * ```typescript
 * const firebaseDb = new FirebaseDB(database);
 * await firebaseDb.checkConnection();
 *
 * // Use in transactions
 * await firebaseDb.runTransaction(async (db) => {
 *   const ref = db.ref('users/user1/posts');
 *   await ref.transaction((current) => (current || 0) + 1);
 * });
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

    /**
     * Executes a callback with transaction support.
     *
     * Unlike Firestore or MongoDB where the transaction context is a special
     * transaction object, Firebase Realtime Database performs transactions at
     * the reference level. The callback receives the database instance, allowing
     * migrations to call `database.ref(path).transaction()` for atomic updates.
     *
     * @param callback - Function to execute with the database instance
     * @returns Promise resolving to the callback's return value
     *
     * @example
     * ```typescript
     * await db.runTransaction(async (database) => {
     *   // Increment a counter atomically
     *   const ref = database.ref('counters/posts');
     *   await ref.transaction((current) => {
     *     return (current || 0) + 1;
     *   });
     *
     *   // Update multiple refs within the same transaction context
     *   const userRef = database.ref('users/user1');
     *   await userRef.transaction((userData) => {
     *     if (!userData) return null;
     *     return { ...userData, lastModified: Date.now() };
     *   });
     * });
     * ```
     */
    async runTransaction<T>(callback: (tx: database.Database) => Promise<T>): Promise<T> {
        return callback(this.database);
    }
}
