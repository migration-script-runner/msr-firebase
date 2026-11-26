import {expect} from "chai"

import {DBConnector} from "../../../src"
import {IntegrationTestConfig} from "../../IntegrationTestConfig"

describe("DBConnector", () => {
    it("connect: success", () => {
        // when: establish connection to emulator
        const database = DBConnector.connect(new IntegrationTestConfig());

        // then: connection created
        expect(database).not.undefined
        expect(database).not.to.be.instanceOf(Promise)
    })

    it("connect: creates distinct Firebase apps for separate connections", () => {
        const cfg = new IntegrationTestConfig()

        const firstDatabase = DBConnector.connect(cfg)
        const secondDatabase = DBConnector.connect(cfg)

        expect(firstDatabase).not.to.equal(secondDatabase)
        expect(firstDatabase.app.name).not.to.equal(secondDatabase.app.name)
    })

    it("connect: no credentials", () => {
        // having: incorrect config w/o credentials
        const cfg = new IntegrationTestConfig()
        cfg.applicationCredentials = undefined

        // when: establish connection we expect an error
        expect(() => DBConnector.connect(cfg)).to.throw(TypeError, "Application credentials not found in configuration");
    })

    it("connect: no Database URL", () => {
        // having: incorrect config w/o credentials
        const cfg = new IntegrationTestConfig()
        cfg.databaseUrl = undefined

        // when: establish connection we expect an error
        expect(() => DBConnector.connect(cfg)).to.throw(Error, "Can't determine Firebase Database URL");
    })

    it("connect: wrong Database URL", () => {
        // having: incorrect config with malformed database URL
        const cfg = new IntegrationTestConfig()
        cfg.databaseUrl = "http://localhost/test"

        // when: establish connection, Firebase rejects a URL that cannot identify a database
        expect(() => DBConnector.connect(cfg)).to.throw(
            Error,
            "Cannot parse Firebase url"
        );
    })
})
