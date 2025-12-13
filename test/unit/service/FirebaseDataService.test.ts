import {TestUtils} from "../../TestUtils";
import {TestConfig} from "../../TestConfig";
import {FirebaseDataService} from "../../../src";
import {expect} from "chai";

describe("FirebaseDataService", () => {

    const cfg = new TestConfig()
    const basePath = cfg.buildPath('test')
    let service:FirebaseDataService

    before(async () => {
        const db = await TestUtils.getDB()
        service = new FirebaseDataService(db)
    })

    after(async () => {
        await TestUtils.clean()
    })

    it("setObject", async () => {
        // when
        await service.setObject(basePath, {a: 1, b: 2})

        // then
        const obj = await service.getObject(basePath)
        expect(obj).not.undefined
        expect(obj.key).eq('test', 'key should be = test')
        expect(obj.a).eq(1, 'a prop should have provided value = 1')
        expect(obj.b).eq(2, 'b prop should have provided value = 2')

    })
    it("getObject", async () => {
        // when
        const obj = await service.getObject(basePath)

        // then
        expect(obj).not.undefined
        expect(obj.key).eq('test', 'key should be = test')
        expect(obj.a).eq(1, 'a prop should have provided value = 1')
        expect(obj.b).eq(2, 'b prop should have provided value = 2')
    })
    it("updateObject", async () => {
        // when
        await service.updateObject(basePath, {c:3,d:4})

        // and
        const obj = await service.getObject(basePath)

        // then
        expect(obj).not.undefined
        expect(obj.key).eq('test', 'key should be = test')
        expect(obj.a).eq(1, 'a prop should have provided value = 1')
        expect(obj.b).eq(2, 'b prop should have provided value = 2')
        expect(obj.c).eq(3, 'c prop should have provided value = 3')
        expect(obj.d).eq(4, 'd prop should have provided value = 4')
    })

    it("getList", async () => {
        // when
        const list = await service.getList(basePath)

        // then
        expect(list).not.undefined
        expect(list.length).eq(4, 'Should have 4 records')
        expect(list[0].key).eq('a', 'The first element should have key = a')
        expect(list[3].value).eq(4, 'The last element should have value = 4')
    })

    it("findAllObjectsBy", async () => {
        // having: some data
        await service.setObject(`${basePath}/objects/1`, {a: 1, b: '4'})
        await service.setObject(`${basePath}/objects/2`, {a: 2, b: '3'})
        await service.setObject(`${basePath}/objects/3`, {a: 3, b: '2'})
        await service.setObject(`${basePath}/objects/4`, {a: 4, b: '1'})
        await service.setObject(`${basePath}/objects/t1`, {a: 'v1', b: 'v2'})
        await service.setObject(`${basePath}/objects/t2`, {a: 'v2', b: 'group1'})
        await service.setObject(`${basePath}/objects/t3`, {a: 'v3', b: 'group1'})

        // when search by b = 3
        let list = await service.findAllObjectsBy(`${basePath}/objects`, 'b', '3')

        // then
        expect(list).not.undefined
        expect(list.length).eq(1, 'Should have 1 record')
        expect(list[0].key).eq('2')
        expect(list[0].a).eq(2)
        expect(list[0].b).eq('3')

        // when search by a = v1
        list = await service.findAllObjectsBy(`${basePath}/objects`, 'a', 'v1')

        // then
        expect(list).not.undefined
        expect(list.length).eq(1, 'Should have 1 record')
        expect(list[0].key).eq('t1')
        expect(list[0].a).eq('v1')
        expect(list[0].b).eq('v2')

        // when search by b = group1
        list = await service.findAllObjectsBy(`${basePath}/objects`, 'b', 'group1')

        // then
        expect(list).not.undefined
        expect(list.length).eq(2, 'Should have 2 records')

        // and records #1
        const r1 = list[0]
        expect(r1.key).eq('t2')
        expect(r1.a).eq('v2')
        expect(r1.b).eq('group1')

        // and records #2
        const r2 = list[1];
        expect(r2.key).eq('t3')
        expect(r2.a).eq('v3')
        expect(r2.b).eq('group1')
    })

    it("convertObjectToList", async () => {
        // when
        const snapshot = await service.getSnapshot(basePath)
        const list = FirebaseDataService.convertObjectToList(snapshot.val())

        // then
        expect(list).not.undefined
        expect(list.length).eq(5)
        expect(list[0].key).eq('a')
        expect(list[4].key).eq('objects')
    })

    it("mixKey", async () => {
        // when null is provided as obj
        const res = FirebaseDataService.mixKey(null, null)
        expect(res).is.null

        // when undefined is provided as obj
        const res1 = FirebaseDataService.mixKey(undefined, null)
        expect(res1).is.undefined

        // when 0 is provided as obj
        const res2 = FirebaseDataService.mixKey(0, null)
        expect(res2).eq(0, 'Should match provided value if the value in boolean representation is negative result')

        // when object provided but key is null
        const res3 = FirebaseDataService.mixKey({g:15}, null)
        expect(res3.g).eq(15)

        // when object and key are provided
        const res4 = FirebaseDataService.mixKey({g:15}, 'key1')
        expect(res4.g).eq(15)
        expect(res4.key).eq('key1')

        expect(() => {
            res4.key = 3
        }).to.throw(`Cannot assign to read only property 'key' of object '#<Object>'`);
    })

    it("getSnapshot", async () => {
        // when
        const snapshot = await service.getSnapshot(basePath)
        const value = snapshot.val()

        // then
        expect(value).not.undefined
        expect(value.c).eq(3)
        expect(value.objects).is.not.undefined
    })
})