import {expect} from "chai";
import sinon from "sinon";
import type { Database } from 'firebase-admin/database';
import {MigrationScriptService} from "../../src";

describe("MigrationScriptService", () => {

    describe("constructor", () => {
        it("should create instance with database and root path", () => {
            const mockDatabase = {} as Database;
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
            } as unknown as Database;

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
            } as unknown as Database;

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
            } as unknown as Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const result = await service.getAllExecuted();

            expect(result.map((migration) => ({
                name: migration.name,
                timestamp: migration.timestamp,
            }))).to.have.deep.members([
                {name: "migration1", timestamp: 123},
                {name: "migration2", timestamp: 456},
            ]);
        });
    });

    describe("save", () => {
        it("should save migration info with all details", async () => {
            const mockRef = {push: sinon.stub().returns({key: "generated-key"})};
            const refStub = sinon.stub().returns(mockRef);
            const mockDatabase = {
                ref: refStub
            } as unknown as Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            const details = {
                name: "test-migration",
                timestamp: 123,
                executionTime: 100,
                status: "success",
                startedAt: 100,
                finishedAt: 200,
                username: "test-user"
            };

            await service.save(details);

            sinon.assert.calledOnceWithExactly(refStub, "/test/migrations");
            sinon.assert.calledOnceWithMatch(mockRef.push, sinon.match(details));
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
            } as unknown as Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");
            await service.remove(timestamp);

            sinon.assert.calledOnce(removeStub);
            sinon.assert.calledWith(mockDatabase.ref as sinon.SinonStub, "/test/migrations/key1");
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
            } as unknown as Database;

            const service = new MigrationScriptService(mockDatabase, "/test/migrations");

            await expect(service.remove(timestamp)).to.be.fulfilled;
        });

    });
});
