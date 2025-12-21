import {expect} from "chai";
import sinon from "sinon";
import {FirebaseDataService} from "../../src";
import { database } from "firebase-admin";

interface TestObject {
    key?: string;
    name: string;
    value?: number;
}

describe("FirebaseDataService - Instance Methods", () => {
    let service: FirebaseDataService;
    let mockDatabase: any;
    let mockRef: any;
    let mockSnapshot: any;

    beforeEach(() => {
        mockSnapshot = {
            val: sinon.stub(),
            key: 'test-key',
        };

        mockRef = {
            set: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
            once: sinon.stub().resolves(mockSnapshot),
            orderByChild: sinon.stub().returnsThis(),
            equalTo: sinon.stub().returnsThis(),
        };

        mockDatabase = {
            ref: sinon.stub().returns(mockRef),
        } as unknown as database.Database;

        service = new FirebaseDataService(mockDatabase);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("setObject", () => {
        it("should set object at path", async () => {
            const testPath = "/test/path";
            const testData = { name: "test", value: 42 };

            await service.setObject(testPath, testData);

            sinon.assert.calledOnce(mockDatabase.ref);
            sinon.assert.calledWith(mockDatabase.ref, testPath);
            sinon.assert.calledOnce(mockRef.set);
            sinon.assert.calledWith(mockRef.set, testData);
        });
    });

    describe("updateObject", () => {
        it("should update object at path", async () => {
            const testPath = "/test/path";
            const testData = { name: "updated" };

            await service.updateObject(testPath, testData);

            sinon.assert.calledOnce(mockDatabase.ref);
            sinon.assert.calledWith(mockDatabase.ref, testPath);
            sinon.assert.calledOnce(mockRef.update);
            sinon.assert.calledWith(mockRef.update, testData);
        });
    });

    describe("getObject", () => {
        it("should get object with mixed key", async () => {
            mockSnapshot.val.returns({ name: "test", value: 42 });
            mockSnapshot.key = "my-key";

            const result = await service.getObject<TestObject>("/test/path");

            expect(result.name).to.equal("test");
            expect(result.value).to.equal(42);
            expect(result.key).to.equal("my-key");
        });

        it("should handle null snapshot", async () => {
            mockSnapshot.val.returns(null);
            mockSnapshot.key = "my-key";

            const result = await service.getObject<TestObject | null>("/test/path");

            expect(result).to.be.null;
        });
    });

    describe("getList", () => {
        it("should convert object to list", async () => {
            mockSnapshot.val.returns({
                'id1': { name: 'item1' },
                'id2': { name: 'item2' },
            });

            const result = await service.getList<TestObject>("/test/path");

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(2);
            expect(result[0].key).to.equal('id1');
            expect(result[1].key).to.equal('id2');
        });

        it("should handle empty object", async () => {
            mockSnapshot.val.returns(null);

            const result = await service.getList<TestObject>("/test/path");

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });
    });

    describe("findAllObjectsBy", () => {
        it("should find objects by property", async () => {
            mockSnapshot.val.returns({
                'id1': { name: 'Alice', age: 30 },
                'id2': { name: 'Bob', age: 30 },
            });

            const result = await service.findAllObjectsBy<TestObject>("/users", "age", 30);

            sinon.assert.calledWith(mockRef.orderByChild, "age");
            sinon.assert.calledWith(mockRef.equalTo, 30);
            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(2);
        });

        it("should work with string values", async () => {
            mockSnapshot.val.returns({
                'id1': { status: 'active' },
            });

            await service.findAllObjectsBy<TestObject>("/items", "status", "active");

            sinon.assert.calledWith(mockRef.orderByChild, "status");
            sinon.assert.calledWith(mockRef.equalTo, "active");
        });

        it("should work with boolean values", async () => {
            mockSnapshot.val.returns({
                'id1': { published: true },
            });

            await service.findAllObjectsBy<TestObject>("/posts", "published", true);

            sinon.assert.calledWith(mockRef.orderByChild, "published");
            sinon.assert.calledWith(mockRef.equalTo, true);
        });

        it("should work with null values", async () => {
            mockSnapshot.val.returns({
                'id1': { deleted: null },
            });

            await service.findAllObjectsBy<TestObject>("/items", "deleted", null);

            sinon.assert.calledWith(mockRef.orderByChild, "deleted");
            sinon.assert.calledWith(mockRef.equalTo, null);
        });
    });
});

describe("FirebaseDataService - Static Methods", () => {

    describe("mixKey", () => {
        it("should return null when null is provided", () => {
            const result = FirebaseDataService.mixKey(null, null);
            expect(result).is.null;
        });

        it("should return undefined when undefined is provided", () => {
            const result = FirebaseDataService.mixKey(undefined, null);
            expect(result).is.undefined;
        });

        it("should return value when falsy value is provided", () => {
            const result = FirebaseDataService.mixKey(0, null);
            expect(result).eq(0, 'Should match provided value');
        });

        it("should return object without key when key is null", () => {
            const result = FirebaseDataService.mixKey({g: 15}, null);
            expect(result.g).eq(15);
            expect(result.key).is.undefined;
        });

        it("should mix key into object", () => {
            const result = FirebaseDataService.mixKey({g: 15}, 'key1');
            expect(result.g).eq(15);
            expect(result.key).eq('key1');
        });

        it("should make key property read-only", () => {
            const result = FirebaseDataService.mixKey({g: 15}, 'key1');

            expect(() => {
                result.key = 'new-key';
            }).to.throw(TypeError, "Cannot assign to read only property 'key'");
        });
    });

    describe("convertObjectToList", () => {
        it("should return empty array for null", () => {
            const result = FirebaseDataService.convertObjectToList<TestObject>(null);
            expect(result).to.be.an('array');
            expect(result.length).eq(0);
        });

        it("should return empty array for undefined", () => {
            const result = FirebaseDataService.convertObjectToList<TestObject>(undefined as unknown as Record<string, unknown>);
            expect(result).to.be.an('array');
            expect(result.length).eq(0);
        });

        it("should convert object with string keys to array", () => {
            const input = {
                'key1': {name: 'item1', value: 10},
                'key2': {name: 'item2', value: 20}
            };

            const result = FirebaseDataService.convertObjectToList<TestObject>(input);

            expect(result).to.be.an('array');
            expect(result.length).eq(2);
            expect(result[0].key).eq('key1');
            expect(result[0].name).eq('item1');
            expect(result[1].key).eq('key2');
            expect(result[1].name).eq('item2');
        });

        it("should handle nested objects", () => {
            const input = {
                'parent1': {
                    child: {value: 100}
                }
            };

            const result = FirebaseDataService.convertObjectToList<{key?: string, child: {value: number}}>(input);

            expect(result.length).eq(1);
            expect(result[0].key).eq('parent1');
            expect(result[0].child.value).eq(100);
        });

        it("should handle primitive values in object", () => {
            const input = {
                'a': 1,
                'b': 'string',
                'c': true
            };

            const result = FirebaseDataService.convertObjectToList<{key?: string, value: number | string | boolean}>(input);

            expect(result.length).eq(3);
            // mixKey adds key property to all values including primitives wrapped as objects
            expect(result[0].value).eq(1);
            expect(result[0].key).eq('a');
            expect(result[1].value).eq('string');
            expect(result[1].key).eq('b');
            expect(result[2].value).eq(true);
            expect(result[2].key).eq('c');
        });
    });
});
