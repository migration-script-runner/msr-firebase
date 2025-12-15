import {expect} from "chai"

import {DBConnector} from "../../../src"
import {TestConfig} from "../../TestConfig"

describe("DBConnector", () => {
    it("connect: success", async () => {
        // when: establish connection
        const database = await DBConnector.connect(new TestConfig());

        // then: connection created
        expect(database).not.undefined
    })

    it("connect: no credentials", async () => {
        // having: incorrect config w/o credentials
        const cfg = new TestConfig()
        cfg.applicationCredentials = undefined

        // when: establish connection we expect an error
        await expect(DBConnector.connect(cfg)).to.be.rejectedWith(Error, "Application credentials not found");
    })

    it("connect: no Database URL", async () => {
        // having: incorrect config w/o credentials
        const cfg = new TestConfig()
        cfg.databaseUrl = undefined

        // when: establish connection we expect an error
        await expect(DBConnector.connect(cfg)).to.be.rejectedWith(Error, "Can't determine Firebase Database URL");
    })

    it("connect: wrong Database URL", async () => {
        // having: incorrect config w/o credentials
        const cfg = new TestConfig()
        cfg.databaseUrl = "http://localhost/test"

        // when: establish connection we expect an error
        await expect(DBConnector.connect(cfg)).to.be.rejectedWith(Error, "FIREBASE FATAL ERROR: Database URL must point to the root of a Firebase Database (not including a child path).");
    })
})