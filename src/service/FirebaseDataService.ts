import {database} from "firebase-admin";
import _ from 'lodash';

const VALUE = 'value';
const KEY = 'key';

export class FirebaseDataService {

    public constructor(protected db:database.Database) {}

    public async getList<T = unknown>(path: string): Promise<T[]> {
        const snapshot = await this.getSnapshot(path)
        return FirebaseDataService.convertObjectToList<T>(snapshot.val());
    }

    public updateObject(path:string, obj:unknown): Promise<void> {
        return this.db.ref(path).update(obj as Record<string, unknown>);
    }

    public async getObject<T = unknown>(path: string): Promise<T> {
        const snapshot = await this.getSnapshot(path)
        return FirebaseDataService.mixKey(snapshot.val(), snapshot.key);
    }

    public setObject(path:string, obj:unknown): Promise<void> {
        return this.db.ref(path).set(obj);
    }

    public async findAllObjectsBy<T = unknown>(path: string,
                           propertyName: string,
                           value: number | string | boolean | null): Promise<T[]> {
        const snapshot = await this.db.ref(path)
            .orderByChild(propertyName)
            .equalTo(value)
            .once(VALUE);
        return FirebaseDataService.convertObjectToList<T>(snapshot.val());
    }

    public static convertObjectToList<T = unknown>(obj:Record<string, unknown> | null): T[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return _.map(obj, (value, key) => this.mixKey(value instanceof Object ? value: {value:value}, key)) as any;
    }

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

    public getSnapshot(path:string) {
        return this.db.ref(path).once(VALUE)
    }
}