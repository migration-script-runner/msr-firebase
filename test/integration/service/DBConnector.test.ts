import {expect} from "chai"

import {DBConnector} from "../../../src"
import {IntegrationTestConfig} from "../../IntegrationTestConfig"

describe("DBConnector", () => {
    it("connect: success", async () => {
        // when: establish connection to emulator
        const database = await DBConnector.connect(new IntegrationTestConfig());

        // then: connection created
        expect(database).not.undefined
    })

    it("connect: no credentials", async () => {
        // having: incorrect config w/o credentials
        const cfg = new IntegrationTestConfig()
        cfg.applicationCredentials = undefined

        // when: establish connection we expect an error
        await expect(DBConnector.connect(cfg)).to.be.rejectedWith(TypeError, "Application credentials not found in configuration");
    })

    it("connect: no Database URL", async () => {
        // having: incorrect config w/o credentials
        const cfg = new IntegrationTestConfig()
        cfg.databaseUrl = undefined

        // when: establish connection we expect an error
        await expect(DBConnector.connect(cfg)).to.be.rejectedWith(Error, "Can't determine Firebase Database URL");
    })

    it("connect: wrong Database URL", async () => {
        // having: incorrect config with malformed database URL
        const cfg = new IntegrationTestConfig()
        cfg.databaseUrl = "http://localhost/test"

        // when: establish connection we expect an error (either Firebase error or duplicate app error)
        await expect(DBConnector.connect(cfg)).to.be.rejected;
    })
})