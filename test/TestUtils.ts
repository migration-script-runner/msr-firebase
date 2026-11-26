import {TestDataCleaner} from "./TestDataCleaner";
import {DBConnector} from "../src";
import type { Database } from 'firebase-admin/database';
import {TestConfig} from "./TestConfig";

export class TestUtils {
    public static shift = `/test-${Date.now()}`
    private static cleaner:TestDataCleaner
    private static db:Database

    public static async clean() {
        const database = this.getDB();
        if(!this.cleaner) this.cleaner = new TestDataCleaner(database)
        await this.cleaner.clean()
    }

    public static getDB(): Database {
        if(!this.db) this.db = DBConnector.connect(new TestConfig())
        return this.db
    }
}