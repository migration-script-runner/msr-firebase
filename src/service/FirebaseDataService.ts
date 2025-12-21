import {database} from "firebase-admin";
import _ from 'lodash';

const VALUE = 'value';
const KEY = 'key';

/**
 * Base service providing core Firebase Realtime Database operations.
 * Handles data retrieval, storage, and conversion between Firebase objects and arrays.
 *
 * Extended by EntityService for type-safe entity management.
 *
 * @example
 * ```typescript
 * const service = new FirebaseDataService(db);
 * const data = await service.getList<User>('/users');
 * ```
 */
export class FirebaseDataService {

    public constructor(protected readonly db:database.Database) {}

    /**
     * Retrieves data from Firebase path and converts to array.
     * Each item includes its Firebase key in the `key` property.
     *
     * @template T - Type of items in the array
     * @param path - Firebase path to retrieve data from
     * @returns Promise resolving to array of items
     */
    public async getList<T = unknown>(path: string): Promise<T[]> {
        const snapshot = await this.getSnapshot(path)
        return FirebaseDataService.convertObjectToList<T>(snapshot.val());
    }

    /**
     * Updates an object at the specified Firebase path.
     * Merges provided properties with existing data.
     *
     * @param path - Firebase path to update
     * @param obj - Object with properties to update
     * @returns Promise that resolves when update completes
     */
    public updateObject(path:string, obj:unknown): Promise<void> {
        return this.db.ref(path).update(obj as Record<string, unknown>);
    }

    /**
     * Retrieves a single object from Firebase path.
     * Includes the Firebase key in the `key` property.
     *
     * @template T - Type of object to retrieve
     * @param path - Firebase path to retrieve from
     * @returns Promise resolving to object with key mixed in
     */
    public async getObject<T = unknown>(path: string): Promise<T> {
        const snapshot = await this.getSnapshot(path)
        return FirebaseDataService.mixKey(snapshot.val(), snapshot.key);
    }

    /**
     * Sets (replaces) an object at the specified Firebase path.
     * Overwrites existing data completely.
     *
     * @param path - Firebase path to set data at
     * @param obj - Object to set
     * @returns Promise that resolves when set completes
     */
    public setObject(path:string, obj:unknown): Promise<void> {
        return this.db.ref(path).set(obj);
    }

    /**
     * Queries Firebase for objects where a property matches a value.
     * Uses Firebase orderByChild() and equalTo() query.
     *
     * @template T - Type of objects to retrieve
     * @param path - Firebase path to query
     * @param propertyName - Property name to filter by
     * @param value - Value to match
     * @returns Promise resolving to array of matching objects
     */
    public async findAllObjectsBy<T = unknown>(path: string,
                           propertyName: string,
                           value: number | string | boolean | null): Promise<T[]> {
        const snapshot = await this.db.ref(path)
            .orderByChild(propertyName)
            .equalTo(value)
            .once(VALUE);
        return FirebaseDataService.convertObjectToList<T>(snapshot.val());
    }

    /**
     * Converts a Firebase object to an array with keys mixed in.
     * Each item receives its Firebase key as a `key` property.
     *
     * @template T - Type of items in resulting array
     * @param obj - Firebase object (record) or null
     * @returns Array of items with keys mixed in
     */
    public static convertObjectToList<T = unknown>(obj:Record<string, unknown> | null): T[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return _.map(obj, (value, key) => this.mixKey(value instanceof Object ? value: {value:value}, key)) as any;
    }

    /**
     * Mixes a Firebase key into an object as a read-only `key` property.
     * Returns the object unchanged if obj or key is null/undefined.
     *
     * @param obj - Object to add key to
     * @param key - Firebase key to add
     * @returns Object with key property added (read-only)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static mixKey(obj:any, key:string|null|undefined): any {
        if(!obj || !key) return obj;

        if (typeof obj === 'object' && obj !== null) {
            Object.defineProperty(obj, KEY, {
                value: key,
                enumerable: false,
                writable: false
            });
        }
        return obj;
    }

    /**
     * Gets a Firebase snapshot at the specified path.
     *
     * @param path - Firebase path to get snapshot from
     * @returns Promise resolving to Firebase DataSnapshot
     */
    public getSnapshot(path:string) {
        return this.db.ref(path).once(VALUE)
    }
}