import {TestDataCleaner} from "./TestDataCleaner";
import {DBConnector} from "../src";
import {database} from "firebase-admin";
import {TestConfig} from "./TestConfig";

export class TestUtils {
    public static shift = `/test-${Date.now()}`
    private static cleaner:TestDataCleaner
    private static db:database.Database

    public static async clean() {
        const database = await this.getDB();
        if(!this.cleaner) this.cleaner = new TestDataCleaner(database)
        await this.cleaner.clean()
    }

    public static async getDB() {
        if(!this.db) this.db = await DBConnector.connect(new TestConfig())
        return this.db
    }
}