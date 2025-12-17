import {expect} from "chai"
import {database} from "firebase-admin"

import {BackupService, EntityService, DBConnector} from "../../../src"
import {TestEntity} from "../../TestEntity"
import {IntegrationTestConfig} from "../../IntegrationTestConfig"

describe('BackupService', () => {
    let db:database.Database
    let dataService:EntityService<TestEntity>
    const cfg = new IntegrationTestConfig()

    before(async () => {
        db = await DBConnector.connect(cfg)
        dataService = new EntityService<TestEntity>(db, cfg.buildPath("data"))
    })

    after(async () => {
        await db.ref(cfg.shift!).remove()
    })

    it("Backup", async () => {
        // having: seed data
        const a = new TestEntity("20")
        const key = await dataService.save(a)

        // when: backup
        const backupService = new BackupService(db)
        const data = await backupService.backup()

        // then: convert to obj
        const dump = JSON.parse(data)
        expect(dump).not.undefined

        // and: verify
        const testSuiteKey = cfg.shift!.replace('/', '')
        let res = dump['/'][testSuiteKey]['data'][key] as TestEntity
        expect(res).not.undefined
        expect(res.test).eq("20", 'Should be a previously stored 20 in a test property')
    })

    it("Restore", async () => {
        // having: data to restore
        const testSuiteKey = cfg.shift!.replace('/', '')
        const data: Record<string, Record<string, unknown>> = {
            '/': {}
        };
        data['/'][testSuiteKey] = {
            "data": {
                "-NlKhl6V1CSxyKlJc7vW": {
                    "test": "77"
                }
            }
        }

        // when: restore this data
        const backupService = new BackupService(db)
        const stringValue = JSON.stringify(data);
        await backupService.restore(stringValue)

        // check the data after restore
        const records = await dataService.getAll();
        expect(records.length).eq(1, 'Should be one record')
        expect(records[0].test).eq("77", 'Should have a test property value equal to 77')
    })
})