import {FirebaseDataService} from "./FirebaseDataService";
import {database} from "firebase-admin";
import {IEntity} from "../interface";

/**
 * Type-safe service for managing entities in Firebase Realtime Database.
 * Provides CRUD operations, batch updates, and query capabilities with generic type support.
 *
 * @template T - Entity type that extends IEntity interface
 * @extends FirebaseDataService
 *
 * @example
 * ```typescript
 * interface User extends IEntity {
 *   name: string;
 *   email: string;
 *   role: 'admin' | 'user';
 * }
 *
 * const userService = new EntityService<User>(db.database, 'users');
 * const users = await userService.getAll();
 * ```
 */
export class EntityService<T extends IEntity> extends FirebaseDataService {
    /**
     * Creates a new EntityService instance.
     *
     * @param db - Firebase Realtime Database instance
     * @param root - Root path for the entity collection (e.g., 'users', 'production/users')
     */
    constructor(public db: database.Database,
                protected root:string) {
        super(db);
    }

    /**
     * Retrieves all entities from the collection as an array.
     * Each entity includes its Firebase key in the `key` property.
     *
     * @returns Promise that resolves to an array of entities
     *
     * @example
     * ```typescript
     * const users = await userService.getAll();
     * console.log(`Found ${users.length} users`);
     * ```
     */
    public getAll():Promise<T[]> {
        return this.getList(this.root);
    }

    /**
     * Retrieves all entities as an object with keys as properties.
     *
     * @returns Promise that resolves to an object containing all entities
     *
     * @example
     * ```typescript
     * const usersObject = await userService.getAllAsObject();
     * const user = usersObject['user-key-123'];
     * ```
     */
    getAllAsObject() {
        return this.getObject(this.root);
    }

    /**
     * Retrieves a single entity by its key.
     *
     * @param key - The Firebase key of the entity to retrieve
     * @returns Promise that resolves to the entity or null if not found
     *
     * @example
     * ```typescript
     * const user = await userService.get('user-key-123');
     * if (user) {
     *   console.log(user.name);
     * }
     * ```
     */
    get(key:string):Promise<T> {
        return this.getObject(`${this.root}/${key}`);
    }

    /**
     * Smart save method that creates a new entity if no key is provided,
     * or updates an existing entity if key is present.
     *
     * @param obj - Entity object to save (with or without key)
     * @returns Promise that resolves to the entity key (existing or newly created)
     *
     * @example
     * ```typescript
     * // Create new entity (no key)
     * const newKey = await userService.save({ name: 'Alice', email: 'alice@example.com' });
     *
     * // Update existing entity (with key)
     * const existingKey = await userService.save({ key: 'user-123', name: 'Alice Updated', email: 'alice@example.com' });
     * ```
     */
    async save(obj:T) {
        return obj.key ? this.update(obj.key, obj) : this.create(obj);
    }

    /**
     * Creates a new entity with an auto-generated Firebase key.
     *
     * @param obj - Entity object to create (key will be auto-generated)
     * @returns Promise that resolves to the newly created entity's key
     *
     * @example
     * ```typescript
     * const newKey = await userService.create({
     *   name: 'Bob',
     *   email: 'bob@example.com',
     *   role: 'user'
     * });
     * console.log(`Created user with key: ${newKey}`);
     * ```
     */
    async create(obj: T) {
        const ref = await this.db.ref(this.root).push(obj);
        return ref.key as string;
    }

    /**
     * Batch updates all entities in the collection using a provided update function.
     * The update function should modify the entity and return true if modified, false if skipped.
     *
     * @param update - Function that modifies each entity and returns true if modified
     * @returns Promise that resolves to results containing arrays of updated and skipped entity keys
     *
     * @example
     * ```typescript
     * const results = await userService.updateAll((user) => {
     *   if (user.verified !== undefined) {
     *     return false; // Already has field, skip
     *   }
     *   user.verified = false;
     *   return true; // Modified
     * });
     *
     * console.log(`Updated: ${results.updated.length}, Skipped: ${results.skipped.length}`);
     * ```
     */
    async updateAll(update:UpdateFunction<T>) {
        return this.getAll().then(async entities => {

            const results:ModificationResults = {
                skipped: [],
                updated: []
            };

            const tryUpdate = async (entity: T) => {
                const isModified = update(entity);

                if (!isModified) {
                    results.skipped.push(entity.key as string)
                    return;
                }

                await this.save(entity);
                results.updated.push(entity.key as string)
            }

            const tasks = entities.map(entity => tryUpdate(entity));
            await Promise.all(tasks);
            return results
        })
    }

    /**
     * Updates an existing entity at the specified key.
     * Uses Firebase update() which merges the provided object with existing data.
     *
     * @param key - The Firebase key of the entity to update
     * @param obj - Partial or complete entity object with fields to update
     * @returns Promise that resolves to the entity key
     *
     * @example
     * ```typescript
     * await userService.update('user-key-123', {
     *   email: 'newemail@example.com',
     *   updatedAt: Date.now()
     * });
     * ```
     */
    async update(key: string, obj: T) {
        await this.updateObject(`${this.root}/${key}`, obj);
        return key;
    }

    /**
     * Sets (replaces) an entity at the specified key.
     * Uses Firebase set() which completely overwrites existing data.
     *
     * @param key - The Firebase key of the entity to set
     * @param obj - Complete entity object to set
     * @returns Promise that resolves to the entity key
     *
     * @example
     * ```typescript
     * await userService.set('user-key-123', {
     *   name: 'Alice',
     *   email: 'alice@example.com',
     *   role: 'admin'
     * });
     * ```
     */
    async set(key: string, obj: T) {
        await this.setObject(`${this.root}/${key}`, obj);
        return key;
    }

    /**
     * Removes (deletes) a single entity by its key.
     *
     * @param key - The Firebase key of the entity to remove
     * @returns Promise that resolves to the removed entity's key
     *
     * @example
     * ```typescript
     * await userService.remove('user-key-123');
     * console.log('User removed');
     * ```
     */
    async remove(key: string) {
        await this.db.ref(`${this.root}/${key}`).remove();
        return key;
    }

    /**
     * Removes multiple entities by their keys in parallel.
     *
     * @param ids - Array of Firebase keys to remove
     * @returns Promise that resolves when all entities are removed
     *
     * @example
     * ```typescript
     * const keysToRemove = ['key1', 'key2', 'key3'];
     * await userService.removeByIds(keysToRemove);
     * console.log(`Removed ${keysToRemove.length} users`);
     * ```
     */
    async removeByIds(ids:string[]) {
        const task = ids.map(id => this.remove(id));
        await Promise.all(task)
    }

    /**
     * Removes all entities in the collection.
     * ⚠️ WARNING: This is a destructive operation that cannot be undone.
     *
     * @returns Promise that resolves when all entities are removed
     *
     * @example
     * ```typescript
     * // Use with caution!
     * await userService.removeAll();
     * console.log('All users removed');
     * ```
     */
    async removeAll() {
        await this.setObject(this.root, '')
    }

    /**
     * Finds all entities where a specific property matches a given value.
     * Uses Firebase orderByChild() query.
     *
     * @param propertyName - The property name to query
     * @param value - The value to match (number, string, boolean, or null)
     * @returns Promise that resolves to an array of matching entities
     *
     * @example
     * ```typescript
     * // Find all admin users
     * const admins = await userService.findAllBy('role', 'admin');
     *
     * // Find all verified users
     * const verified = await userService.findAllBy('verified', true);
     *
     * // Find users with specific age
     * const thirtyYearOlds = await userService.findAllBy('age', 30);
     * ```
     */
    findAllBy(propertyName:string,
              value:number | string | boolean | null):Promise<T[]> {
        return super.findAllObjectsBy(this.root, propertyName, value);
    }
}

/**
 * Function type for updateAll() method.
 * Should modify the entity in-place and return true if modified, false if skipped.
 *
 * @template T - Entity type
 * @param entity - Entity to update
 * @returns true if entity was modified, false if skipped
 */
export type UpdateFunction<T> = (entity:T) => boolean

/**
 * Results object returned by updateAll() method.
 * Contains arrays of entity keys that were updated or skipped.
 */
export type ModificationResults = {
    /** Array of keys for entities that were skipped (not modified) */
    skipped: string[],
    /** Array of keys for entities that were updated */
    updated: string[]
}