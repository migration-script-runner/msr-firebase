import {FirebaseConfig} from "../src";
import {TestUtils} from "./TestUtils";

export class TestConfig extends FirebaseConfig {

    constructor() {
        super()
        this.shift = TestUtils.shift
        this.folder = `${process.cwd()}/test/resources/migrations`
    }
}