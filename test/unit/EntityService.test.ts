import {expect} from "chai";
import sinon from "sinon";
import { database } from "firebase-admin";
import {EntityService} from "../../src/service/EntityService";
import type {IEntity} from "../../src/interface/IEntity";

interface TestEntity extends IEntity {
    name: string;
    value?: number;
}

// Helper to create test entities
const createTestEntity = (name: string, value?: number, key?: string): TestEntity => ({
    key: key || undefined,
    name,
    value
});

describe("EntityService", () => {
    let service: EntityService<TestEntity>;
    let mockDatabase: any;
    let mockRef: any;
    let mockSnapshot: any;
    let mockPushRef: any;

    beforeEach(() => {
        mockSnapshot = {
            val: sinon.stub(),
            key: 'test-key',
            numChildren: sinon.stub().returns(0),
            forEach: sinon.stub()
        };

        mockPushRef = {
            key: 'pushed-key'
        };

        mockRef = {
            set: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
            remove: sinon.stub().resolves(),
            once: sinon.stub().resolves(mockSnapshot),
            push: sinon.stub().resolves(mockPushRef),
            orderByChild: sinon.stub().returnsThis(),
            equalTo: sinon.stub().returnsThis(),
        };

        mockDatabase = {
            ref: sinon.stub().returns(mockRef),
        } as unknown as database.Database;

        service = new EntityService<TestEntity>(mockDatabase, '/test/entities');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("constructor", () => {
        it("should initialize with database and root path", () => {
            expect(service).to.be.instanceOf(EntityService);
            expect(service.db).to.equal(mockDatabase);
        });
    });

    describe("getAll", () => {
        it("should return empty array when no entities exist", async () => {
            mockSnapshot.val.returns(null);

            const result = await service.getAll();

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
            sinon.assert.calledWith(mockDatabase.ref, '/test/entities');
        });

        it("should return array of entities with keys", async () => {
            mockSnapshot.val.returns({
                'entity1': { name: 'Test 1', value: 10 },
                'entity2': { name: 'Test 2', value: 20 }
            });

            const result = await service.getAll();

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(2);
            expect(result[0].key).to.equal('entity1');
            expect(result[0].name).to.equal('Test 1');
            expect(result[1].key).to.equal('entity2');
            expect(result[1].name).to.equal('Test 2');
        });
    });

    describe("getAllAsObject", () => {
        it("should return entities as object", async () => {
            mockSnapshot.val.returns({
                name: 'Test Entity',
                value: 42
            });
            mockSnapshot.key = 'entity-key';

            const result = await service.getAllAsObject();

            expect(result).to.deep.include({ name: 'Test Entity', value: 42 });
        });

        it("should handle null value", async () => {
            mockSnapshot.val.returns(null);

            const result = await service.getAllAsObject();

            expect(result).to.be.null;
        });
    });

    describe("get", () => {
        it("should retrieve entity by key", async () => {
            mockSnapshot.val.returns({ name: 'Found Entity', value: 100 });
            mockSnapshot.key = 'found-key';

            const result = await service.get('found-key');

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities/found-key');
            expect(result.name).to.equal('Found Entity');
            expect(result.value).to.equal(100);
            expect(result.key).to.equal('found-key');
        });

        it("should return null for non-existent entity", async () => {
            mockSnapshot.val.returns(null);

            const result = await service.get('non-existent');

            expect(result).to.be.null;
        });
    });

    describe("create", () => {
        it("should create new entity with auto-generated key", async () => {
            const entity = createTestEntity('New Entity', 50);

            const key = await service.create(entity);

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities');
            sinon.assert.calledOnce(mockRef.push);
            sinon.assert.calledWith(mockRef.push, entity);
            expect(key).to.equal('pushed-key');
        });

        it("should handle entity without optional fields", async () => {
            const entity = createTestEntity('Minimal Entity');

            const key = await service.create(entity);

            expect(key).to.equal('pushed-key');
            sinon.assert.calledWith(mockRef.push, entity);
        });
    });

    describe("save", () => {
        it("should create entity when key is undefined", async () => {
            const entity = createTestEntity('Save Create');
            const pushSpy = sinon.spy(service, 'create');

            const key = await service.save(entity);

            expect(pushSpy.calledOnce).to.be.true;
            expect(key).to.equal('pushed-key');
        });

        it("should update entity when key is provided", async () => {
            const entity = createTestEntity('Save Update', 99, 'existing-key');
            const updateSpy = sinon.spy(service, 'update');

            const key = await service.save(entity);

            expect(updateSpy.calledOnce).to.be.true;
            expect(key).to.equal('existing-key');
        });
    });

    describe("update", () => {
        it("should update entity at specified key", async () => {
            const entity = createTestEntity('Updated', 200);

            const key = await service.update('update-key', entity);

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities/update-key');
            sinon.assert.calledOnce(mockRef.update);
            sinon.assert.calledWith(mockRef.update, entity);
            expect(key).to.equal('update-key');
        });

        it("should handle partial updates", async () => {
            const partialEntity = createTestEntity('Only Name');

            const key = await service.update('partial-key', partialEntity);

            expect(key).to.equal('partial-key');
            sinon.assert.calledWith(mockRef.update, partialEntity);
        });
    });

    describe("set", () => {
        it("should set entity at specified key", async () => {
            const entity = createTestEntity('Set Entity', 300);

            const key = await service.set('set-key', entity);

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities/set-key');
            sinon.assert.calledOnce(mockRef.set);
            sinon.assert.calledWith(mockRef.set, entity);
            expect(key).to.equal('set-key');
        });

        it("should overwrite existing entity completely", async () => {
            const entity = createTestEntity('Replace');

            await service.set('replace-key', entity);

            sinon.assert.calledWith(mockRef.set, entity);
        });
    });

    describe("remove", () => {
        it("should remove entity by key", async () => {
            const key = await service.remove('remove-key');

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities/remove-key');
            sinon.assert.calledOnce(mockRef.remove);
            expect(key).to.equal('remove-key');
        });
    });

    describe("removeByIds", () => {
        it("should remove multiple entities by keys", async () => {
            const keys = ['key1', 'key2', 'key3'];
            const removeSpy = sinon.spy(service, 'remove');

            await service.removeByIds(keys);

            expect(removeSpy.callCount).to.equal(3);
            expect(removeSpy.calledWith('key1')).to.be.true;
            expect(removeSpy.calledWith('key2')).to.be.true;
            expect(removeSpy.calledWith('key3')).to.be.true;
        });

        it("should handle empty array", async () => {
            const removeSpy = sinon.spy(service, 'remove');

            await service.removeByIds([]);

            expect(removeSpy.callCount).to.equal(0);
        });

        it("should remove all entities in parallel", async () => {
            const keys = ['a', 'b', 'c', 'd', 'e'];

            await service.removeByIds(keys);

            expect(mockRef.remove.callCount).to.equal(5);
        });
    });

    describe("removeAll", () => {
        it("should remove all entities in collection", async () => {
            await service.removeAll();

            sinon.assert.calledWith(mockDatabase.ref, '/test/entities');
            sinon.assert.calledOnce(mockRef.set);
            sinon.assert.calledWith(mockRef.set, '');
        });
    });

    describe("findAllBy", () => {
        it("should find entities by string property", async () => {
            mockSnapshot.val.returns({
                'id1': { name: 'Alice', value: 30 },
                'id2': { name: 'Bob', value: 30 }
            });

            const result = await service.findAllBy('value', 30);

            sinon.assert.calledWith(mockRef.orderByChild, 'value');
            sinon.assert.calledWith(mockRef.equalTo, 30);
            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(2);
        });

        it("should find entities by boolean property", async () => {
            mockSnapshot.val.returns({
                'id1': { name: 'Active', value: 1 }
            });

            await service.findAllBy('active', true);

            sinon.assert.calledWith(mockRef.orderByChild, 'active');
            sinon.assert.calledWith(mockRef.equalTo, true);
        });

        it("should find entities by null property", async () => {
            mockSnapshot.val.returns({});

            await service.findAllBy('deleted', null);

            sinon.assert.calledWith(mockRef.orderByChild, 'deleted');
            sinon.assert.calledWith(mockRef.equalTo, null);
        });

        it("should return empty array when no matches", async () => {
            mockSnapshot.val.returns(null);

            const result = await service.findAllBy('name', 'NonExistent');

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });
    });

    describe("updateAll", () => {
        it("should update all entities that return true from update function", async () => {
            // Setup getAll to return 3 entities
            const getAllStub = sinon.stub(service, 'getAll').resolves([
                { key: 'key1', name: 'Entity 1', value: 10 },
                { key: 'key2', name: 'Entity 2', value: 20 },
                { key: 'key3', name: 'Entity 3', value: 30 }
            ]);

            const saveStub = sinon.stub(service, 'save').resolves('key');

            // Update function that modifies entities with value < 25
            const updateFn = (entity: TestEntity) => {
                if (entity.value && entity.value < 25) {
                    entity.value = 100;
                    return true;
                }
                return false;
            };

            const results = await service.updateAll(updateFn);

            expect(results.updated).to.have.lengthOf(2); // key1, key2
            expect(results.skipped).to.have.lengthOf(1); // key3
            expect(results.updated).to.include('key1');
            expect(results.updated).to.include('key2');
            expect(results.skipped).to.include('key3');
            expect(saveStub.callCount).to.equal(2);

            getAllStub.restore();
            saveStub.restore();
        });

        it("should skip all entities when update function returns false", async () => {
            const getAllStub = sinon.stub(service, 'getAll').resolves([
                { key: 'key1', name: 'Entity 1' },
                { key: 'key2', name: 'Entity 2' }
            ]);

            const saveStub = sinon.stub(service, 'save').resolves('key');

            const updateFn = () => false; // Skip all

            const results = await service.updateAll(updateFn);

            expect(results.updated).to.have.lengthOf(0);
            expect(results.skipped).to.have.lengthOf(2);
            expect(saveStub.callCount).to.equal(0);

            getAllStub.restore();
            saveStub.restore();
        });

        it("should update all entities when update function returns true", async () => {
            const getAllStub = sinon.stub(service, 'getAll').resolves([
                { key: 'key1', name: 'Entity 1' },
                { key: 'key2', name: 'Entity 2' },
                { key: 'key3', name: 'Entity 3' }
            ]);

            const saveStub = sinon.stub(service, 'save').resolves('key');

            const updateFn = (entity: TestEntity) => {
                entity.value = 999;
                return true;
            };

            const results = await service.updateAll(updateFn);

            expect(results.updated).to.have.lengthOf(3);
            expect(results.skipped).to.have.lengthOf(0);
            expect(saveStub.callCount).to.equal(3);

            getAllStub.restore();
            saveStub.restore();
        });

        it("should handle empty collection", async () => {
            const getAllStub = sinon.stub(service, 'getAll').resolves([]);
            const saveStub = sinon.stub(service, 'save').resolves('key');

            const updateFn = () => true;

            const results = await service.updateAll(updateFn);

            expect(results.updated).to.have.lengthOf(0);
            expect(results.skipped).to.have.lengthOf(0);
            expect(saveStub.callCount).to.equal(0);

            getAllStub.restore();
            saveStub.restore();
        });

        it("should process entities in parallel", async () => {
            const entities = Array.from({ length: 10 }, (_, i) => ({
                key: `key${i}`,
                name: `Entity ${i}`,
                value: i
            }));

            const getAllStub = sinon.stub(service, 'getAll').resolves(entities);
            const saveStub = sinon.stub(service, 'save').resolves('key');

            const updateFn = () => true;

            await service.updateAll(updateFn);

            expect(saveStub.callCount).to.equal(10);

            getAllStub.restore();
            saveStub.restore();
        });
    });
});
