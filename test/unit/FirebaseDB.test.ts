import {expect} from "chai";
import sinon from "sinon";
import {database} from "firebase-admin";
import {FirebaseDB} from "../../src";

describe("FirebaseDB", () => {

    describe("checkConnection", () => {
        it("should return true when connection is successful", async () => {
            // Mock database
            const mockSnapshot = {val: sinon.stub().returns(true)};
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            const refStub = sinon.stub().returns(mockRef);
            const mockDatabase = {
                ref: refStub
            } as unknown as database.Database;

            const firebaseDB = new FirebaseDB(mockDatabase);

            const result = await firebaseDB.checkConnection();

            expect(result).eq(true);
            sinon.assert.calledWith(refStub, '.info/connected');
            sinon.assert.calledWith(mockRef.once, 'value');
        });

        it("should return false when connection fails", async () => {
            // Mock database that throws error
            const mockRef = {
                once: sinon.stub().rejects(new Error("Connection failed"))
            };
            const mockDatabase = {
                ref: sinon.stub().returns(mockRef)
            } as unknown as database.Database;

            const firebaseDB = new FirebaseDB(mockDatabase);

            const result = await firebaseDB.checkConnection();

            expect(result).eq(false);
        });

        it("should use .info/connected path for connection check", async () => {
            const mockSnapshot = {val: sinon.stub().returns(true)};
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            const refStub = sinon.stub().returns(mockRef);
            const mockDatabase = {
                ref: refStub
            } as unknown as database.Database;

            const firebaseDB = new FirebaseDB(mockDatabase);

            await firebaseDB.checkConnection();

            sinon.assert.calledOnceWithExactly(refStub, '.info/connected');
        });
    });

    describe("runTransaction", () => {
        it("should execute callback with database instance", async () => {
            const mockDatabase = {} as database.Database;
            const firebaseDB = new FirebaseDB(mockDatabase);

            const callback = sinon.stub().resolves("result");

            const result = await firebaseDB.runTransaction(callback);

            sinon.assert.calledOnceWithExactly(callback, mockDatabase);
            expect(result).eq("result");
        });

        it("should pass through callback return value", async () => {
            const mockDatabase = {} as database.Database;
            const firebaseDB = new FirebaseDB(mockDatabase);

            const expectedValue = {data: "test", count: 42};
            const callback = sinon.stub().resolves(expectedValue);

            const result = await firebaseDB.runTransaction(callback);

            expect(result).deep.eq(expectedValue);
        });

        it("should propagate errors from callback", async () => {
            const mockDatabase = {} as database.Database;
            const firebaseDB = new FirebaseDB(mockDatabase);

            const error = new Error("Transaction failed");
            const callback = sinon.stub().rejects(error);

            await expect(
                firebaseDB.runTransaction(callback)
            ).to.be.rejectedWith("Transaction failed");
        });
    });

    describe("database property", () => {
        it("should expose database instance", () => {
            const mockDatabase = {
                ref: sinon.stub()
            } as unknown as database.Database;

            const firebaseDB = new FirebaseDB(mockDatabase);

            expect(firebaseDB.database).eq(mockDatabase);
        });

        it("should be accessible as readonly", () => {
            const mockDatabase = {test: 'value'} as unknown as database.Database;
            const firebaseDB = new FirebaseDB(mockDatabase);

            // TypeScript marks it as readonly, but at runtime it's just a property
            // The important part is that it's exposed and accessible
            expect(firebaseDB.database).to.deep.eq(mockDatabase);
        });
    });
});
