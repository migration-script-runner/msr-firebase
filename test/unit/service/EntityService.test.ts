import {TestUtils} from "../../TestUtils";
import {TestConfig} from "../../TestConfig";
import {EntityService} from "../../../src";
import {TestEntity} from "../../TestEntity";
import {expect} from "chai";

describe('EntityService', () => {

    let entityService:EntityService<TestEntity>

    const seedKey = 'seed-id'
    const seedObj = new TestEntity("123")

    const customKey = 'customKey'
    const updatedValue = 'updatedValue'

    const seedData = () => {
        entityService.set(seedKey, seedObj)
    }

    before(async () => {
        const db = await TestUtils.getDB()
        const cfg = new TestConfig()
        entityService = new EntityService<TestEntity>(db, cfg.buildPath("some-entity"))
        seedData()
    })

    after(async () => {
        await TestUtils.clean()
    })

    it('getAll', async () => {
        // when
        const res = await entityService.getAll();

        // then
        expect(res.length).eq(1, "Should be one record in table")
        expect(res[0].key).eq(seedKey, "The key should be equal to 'seed-id'")
        expect(res[0].test).eq(seedObj.test, "The value should be equal to '123'")
    })

    it('getAllAsObject', async () => {
        // when
        const res = await entityService.getAllAsObject();

        // then
        expect(res).is.not.undefined
        expect(res.hasOwnProperty(seedKey)).is.true
        expect(res[seedKey]['test']).eq('123', "The value should be equal to '123'")
    })

    it('get', async () => {
        // when
        const res = await entityService.get(seedKey);

        // then
        expect(res).is.not.undefined
        expect(res.hasOwnProperty('test')).is.true
        expect(res.test).eq('123', "The value should be equal to '123'")
    })

    it('save', async () => {
        // when: create
        const e = new TestEntity("-")
        const key = await entityService.save(e);

        // then
        expect(key).is.not.undefined

        // and
        const e2 = await entityService.get(key);

        // then
        expect(e2.key).eq(key, "The received key and entity key should be equal")
        expect(e2.test).eq(e.test, "The value should be equal to '-'")

        // when: update
        e2.test = '+'
        const key2 = await entityService.save(e2);

        // then
        expect(key2).eq(key, 'The key should remain the same')

        // when: get last version
        const e3 = await entityService.get(key2);

        // then
        expect(e3.key).eq(e2.key, "The received key and entity key should be equal")
        expect(e3.test).eq(e2.test, "The value should be equal to '-'")
    })

    it('create', async () => {
        // when
        const e = new TestEntity("-")
        const key = await entityService.create(e);

        // then
        expect(key).is.not.undefined

        // and
        const e2 = await entityService.get(key);
        expect(e2.key).eq(key, "The received key and entity key should be equal")
        expect(e2.test).eq(e.test, "The value should be equal to '-'")
    })

    it('updateAll', async () => {
        // having: 1 seeded record and 2 from previous tests

        // when: set key to 'test' prop
        const fn = (entity:TestEntity) => {
            if(entity.key == seedKey) return false // skips seeded record

            entity.test = entity.key as string
            return true
        }
        const results = await entityService.updateAll(fn);

        // then
        expect(results).is.not.undefined
        expect(results.updated.length).eq(2, '2 records were updated')
        expect(results.skipped.length).eq(1, '1 record was skipped')
        expect(results.skipped.some(key => key == seedKey), 'Seeded record should be skipped').is.true

        // when
        const all = await entityService.getAll();

        // then
        expect(all.length).eq(3, 'Should contain 3 records')

        const skipped = all.filter(e => e.key == seedKey)[0];
        const updated = all.filter(e => e.key != seedKey)[0];

        expect(skipped.test).eq(seedObj.test, 'Value should remain the same')
        expect(updated.test).eq(updated?.key, 'Value should be updated to key value')
    })

    it('update', async () => {
        // when: update
        const all = await entityService.getAll()
        const e = all.filter(e => e.key != seedKey)[0];
        const initValue = e.test

        e.test = "updatedValue"
        const key = await entityService.save(e);

        // then
        expect(key).eq(e.key, 'The key should remain the same')

        // when: get last version
        const e2 = await entityService.get(key);

        // then
        expect(e2.key).eq(e.key, "The received key and entity key should be equal")
        expect(e2.test).not.eq(initValue, "The value should NOT be the same")
        expect(e2.test).eq(e.test, "The value should be updated")
    })

    it('findAllBy', async () => {
        // when
        const searchResult = await entityService.findAllBy('test', updatedValue)

        // then
        expect(searchResult.length).eq(1, 'Should find 1 record')
        expect(searchResult[0].test).eq(updatedValue, 'The test prop should be equal to updatedValue')
    })

    it('set', async () => {
        // when
        const last = new TestEntity('last')
        const key = await entityService.set(customKey, last);

        // then
        expect(key).eq(customKey, 'Keys should be equal')

        // when
        const e = await entityService.get(key);

        // then
        expect(e).is.not.undefined
        expect(e.key).eq(key, 'Keys should be equal')
        expect(e.test).eq(last.test, 'Test properties should be equal')
    })

    it('remove', async () => {
        // having
        const before = (await entityService.getAll()).length

        // when
        const key = await entityService.remove(customKey)

        // then
        expect(key).eq(customKey, 'Keys of requested to remove and removed items should be the same')

        // and
        const after = (await entityService.getAll()).length
        expect(after).not.eq(before, 'Number of records should be updated')
        expect(after).eq(before - 1, 'Number of records should be decreased')
    })

    it('removeByIds', async () => {
        // having
        const all = await entityService.getAll();
        const before = all.length
        const keys = all.map(e => e.key as string)

        // when
        await entityService.removeByIds(keys)

        // then
        const after = (await entityService.getAll()).length
        expect(after).not.eq(before, 'Number of records should be updated')
        expect(after).eq(0, 'Should be 0 records')
    })

    it('removeAll', async () => {
        // having
        await entityService.save(new TestEntity('1'))
        await entityService.save(new TestEntity('2'))
        await entityService.save(new TestEntity('3'))

        const all = await entityService.getAll();
        const before = all.length

        // when
        await entityService.removeAll()

        // then
        const after = (await entityService.getAll()).length
        expect(after).eq(0, 'Should be 0 records')
    })
})