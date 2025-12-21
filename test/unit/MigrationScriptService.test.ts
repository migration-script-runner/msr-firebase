import {expect} from "chai";
import sinon from "sinon";
import {database} from "firebase-admin";
import {MigrationScriptService} from "../../src";

describe("MigrationScriptService", () => {

    describe("constructor", () => {
        it("should create instance with database and root path", () => {
            const mockDatabase = {} as database.Database;
            const service = new MigrationScriptService(mockDatabase, "/test/migrations");

            expect(service.db).eq(mockDatabase);
        });
    });

    describe("getSnapshot", () => {
        it("should call database.ref().once() with correct path", async () => {
            const mockSnapshot = {val: sinon.stub().returns({test: "data"})};
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            const mockDatabase = {
                ref: sinon.stub().returns(mockRef)
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const result = await service.getSnapshot("/test/path");

            sinon.assert.calledWith(mockDatabase.ref as sinon.SinonStub, "/test/path");
            sinon.assert.calledWith(mockRef.once, "value");
            expect(result).eq(mockSnapshot);
        });
    });

    describe("getAllExecuted", () => {
        it("should return empty array when no migrations exist", async () => {
            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({val: sinon.stub().returns(null)})
                })
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const result = await service.getAllExecuted();

            expect(result).to.be.an("array");
            expect(result.length).eq(0);
        });

        it("should return array of migrations when they exist", async () => {
            const mockMigrations = {
                "key1": {name: "migration1", timestamp: 123, key: "key1"},
                "key2": {name: "migration2", timestamp: 456, key: "key2"}
            };
            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({
                        val: sinon.stub().returns(mockMigrations)
                    })
                })
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const result = await service.getAllExecuted();

            expect(result).to.be.an("array");
            expect(result.length).eq(2);
        });
    });

    describe("save", () => {
        it("should save migration info with all details", async () => {
            const mockRef = {
                push: sinon.stub().returns({
                    set: sinon.stub().resolves()
                })
            };
            const mockDatabase = {
                ref: sinon.stub().returns(mockRef)
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const details = {
                name: "test-migration",
                timestamp: Date.now(),
                executionTime: 100,
                status: "success",
                startedAt: Date.now(),
                finishedAt: Date.now(),
                username: "test-user"
            };

            await service.save(details);

            sinon.assert.calledOnce(mockRef.push as sinon.SinonStub);
        });
    });

    describe("remove", () => {
        it("should remove migration by timestamp when it exists", async () => {
            const timestamp = 123456;
            const mockMigrations = {
                "key1": {name: "migration1", timestamp: timestamp, key: "key1"},
                "key2": {name: "migration2", timestamp: 789, key: "key2"}
            };

            const removeStub = sinon.stub().resolves();
            const mockDatabase = {
                ref: sinon.stub().callsFake((path: string) => {
                    if (path.includes("/key1")) {
                        return {remove: removeStub};
                    }
                    return {
                        once: sinon.stub().resolves({
                            val: sinon.stub().returns(mockMigrations)
                        })
                    };
                })
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            await service.remove(timestamp);

            sinon.assert.calledOnce(removeStub);
        });

        it("should not throw error when timestamp not found", async () => {
            const timestamp = 999999;
            const mockMigrations = {
                "key1": {name: "migration1", timestamp: 123, key: "key1"}
            };

            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({
                        val: sinon.stub().returns(mockMigrations)
                    })
                })
            } as unknown as database.Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");

            // Should not throw
            await expect(service.remove(timestamp)).to.be.fulfilled;
        });

    });
});
