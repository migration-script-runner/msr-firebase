import {expect} from "chai";
import {FirebaseDataService} from "../../src";

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
            const result = FirebaseDataService.convertObjectToList(null);
            expect(result).to.be.an('array');
            expect(result.length).eq(0);
        });

        it("should return empty array for undefined", () => {
            const result = FirebaseDataService.convertObjectToList(undefined);
            expect(result).to.be.an('array');
            expect(result.length).eq(0);
        });

        it("should convert object with string keys to array", () => {
            const input = {
                'key1': {name: 'item1', value: 10},
                'key2': {name: 'item2', value: 20}
            };

            const result = FirebaseDataService.convertObjectToList(input);

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

            const result = FirebaseDataService.convertObjectToList(input);

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

            const result = FirebaseDataService.convertObjectToList(input);

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
