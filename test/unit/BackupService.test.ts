import {expect} from "chai";
import sinon from "sinon";
import {database} from "firebase-admin";
import {BackupService} from "../../src";

describe("BackupService", () => {

    describe("deleteBackup", () => {
        it("should clear the last backup", async () => {
            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({
                        val: sinon.stub().returns({test: "data"})
                    })
                })
            } as unknown as database.Database;

            const service = new BackupService(mockDatabase, ["/test/root"]);

            // Create a backup first
            await service.backup();

            // Verify backup exists (accessing private property for testing)
            expect((service as  any).lastBackup).to.not.be.undefined;

            // Delete the backup
            service.deleteBackup();

            // Verify backup is cleared
            expect((service as any).lastBackup).to.be.undefined;
        });

        it("should be safe to call when no backup exists", () => {
            const mockDatabase = {} as database.Database;
            const service = new BackupService(mockDatabase, ["/test/root"]);

            // Should not throw when no backup exists
            expect(() => service.deleteBackup()).to.not.throw();

            // Verify still undefined
            expect((service as any).lastBackup).to.be.undefined;
        });
    });

    describe("restore", () => {
        it("should throw error when no backup data available", async () => {
            const mockDatabase = {} as database.Database;
            const service = new BackupService(mockDatabase, ["/test/root"]);

            // Try to restore without creating backup first
            await expect(service.restore()).to.be.rejectedWith(ReferenceError, "No backup data available to restore");
        });

        it("should restore from last backup when no backup path provided", async () => {
            const mockData = {test: "data", value: 42};
            const setStub = sinon.stub().resolves();
            const mockDatabase = {
                ref: sinon.stub().callsFake((path: string) => {
                    if (path === "/test/root") {
                        return {
                            once: sinon.stub().resolves({
                                val: sinon.stub().returns(mockData)
                            }),
                            set: setStub
                        };
                    }
                    return {
                        once: sinon.stub().resolves({val: sinon.stub().returns(null)})
                    };
                })
            } as unknown as database.Database;

            const service = new BackupService(mockDatabase, ["/test/root"]);

            // Create a backup
            await service.backup();

            // Restore from last backup
            await service.restore();

            // Verify set was called with parsed backup data
            sinon.assert.calledOnce(setStub);
        });

        it("should restore from provided backup path", async () => {
            const mockData = {"/test/root": {test: "restored", value: 100}};
            const setStub = sinon.stub().resolves();
            const mockDatabase = {
                ref: sinon.stub().returns({
                    set: setStub
                })
            } as unknown as database.Database;

            const service = new BackupService(mockDatabase, ["/test/root"]);
            const backupJson = JSON.stringify(mockData);

            // Restore from provided backup
            await service.restore(backupJson);

            // Verify set was called once (for the single node)
            sinon.assert.calledOnce(setStub);
            sinon.assert.calledWith(setStub, {test: "restored", value: 100});
        });
    });

    describe("backup", () => {
        it("should create backup of current data", async () => {
            const mockData = {users: {user1: {name: "Test"}}};
            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({
                        val: sinon.stub().returns(mockData)
                    })
                })
            } as unknown as database.Database;

            const service = new BackupService(mockDatabase, ["/test/root"]);
            await service.backup();

            // Verify backup was stored (accessing private property for testing)
            const lastBackup = (service as any).lastBackup;
            expect(lastBackup).to.not.be.undefined;
            // Backup stores data with node path as key
            expect(JSON.parse(lastBackup)).to.deep.eq({"/test/root": mockData});
        });

        it("should handle empty database", async () => {
            const mockDatabase = {
                ref: sinon.stub().returns({
                    once: sinon.stub().resolves({
                        val: sinon.stub().returns(null)
                    })
                })
            } as unknown as database.Database;

            const service = new BackupService(mockDatabase, ["/test/root"]);
            await service.backup();

            // Verify backup was stored even for null data
            const lastBackup = (service as any).lastBackup;
            expect(lastBackup).to.not.be.undefined;
            // Backup includes node path even for null data
            expect(JSON.parse(lastBackup)).to.deep.eq({"/test/root": null});
        });
    });
});
