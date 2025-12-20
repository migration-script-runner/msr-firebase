import { expect } from "chai";
import sinon from "sinon";
import { database } from "firebase-admin";
import { FirebaseHandler, AppConfig, DBConnector, FirebaseDB } from "../../src";
import { LockingConfig } from "@migration-script-runner/core";

describe("FirebaseHandler", () => {
    let mockDatabase: database.Database;
    let connectStub: sinon.SinonStub;
    let config: AppConfig;

    beforeEach(() => {
        // Mock Firebase database
        const mockRef = {
            once: sinon.stub().resolves({ val: () => null }),
            transaction: sinon.stub().callsFake(async (updateFn: any) => {
                const result = updateFn(null);
                return { committed: true, snapshot: { val: () => result } };
            })
        };
        mockDatabase = {
            ref: sinon.stub().returns(mockRef)
        } as unknown as database.Database;

        // Stub DBConnector.connect
        connectStub = sinon.stub(DBConnector, "connect").resolves(mockDatabase);

        // Create config
        config = new AppConfig();
        config.shift = "test";
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("getInstance", () => {
        it("should create handler instance without locking service", async () => {
            // Explicitly disable locking
            config.locking = new LockingConfig();
            config.locking.enabled = false;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler).to.be.instanceOf(FirebaseHandler);
            expect(handler.db).to.exist;
            expect(handler.backup).to.exist;
            expect(handler.schemaVersion).to.exist;
            expect(handler.lockingService).to.be.undefined;
            sinon.assert.calledOnce(connectStub);
        });

        it("should create handler instance with locking service when enabled", async () => {
            config.locking = new LockingConfig();
            config.locking.enabled = true;
            config.locking.timeout = 60000;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler).to.be.instanceOf(FirebaseHandler);
            expect(handler.lockingService).to.exist;
            expect(handler.lockingService).to.not.be.undefined;
        });

        it("should not create locking service when disabled", async () => {
            config.locking = new LockingConfig();
            config.locking.enabled = false;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.lockingService).to.be.undefined;
        });

        it("should initialize lock storage when locking is enabled", async () => {
            config.locking = new LockingConfig();
            config.locking.enabled = true;

            const handler = await FirebaseHandler.getInstance(config);

            // Verify initLockStorage was called (ref was accessed)
            expect(handler.lockingService).to.exist;
            // The mock should have been called for initLockStorage
            sinon.assert.called(mockDatabase.ref as sinon.SinonStub);
        });

        it("should connect to database with config", async () => {
            await FirebaseHandler.getInstance(config);

            sinon.assert.calledWith(connectStub, config);
        });

        it("should use provided shift for lock path", async () => {
            config.shift = "production";
            config.locking = new LockingConfig();
            config.locking.enabled = true;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.lockingService).to.exist;
            // Lock path should be production/migrations/_lock
        });
    });

    describe("getName", () => {
        it("should return handler name", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            const name = handler.getName();

            expect(name).to.equal("Firebase Realtime Database Runner");
        });
    });

    describe("getVersion", () => {
        it("should return package version", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            const version = handler.getVersion();

            expect(version).to.be.a("string");
            expect(version).to.match(/^\d+\.\d+\.\d+$/);
        });
    });

    describe("properties", () => {
        it("should have db property", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.db).to.be.instanceOf(FirebaseDB);
        });

        it("should have backup property", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.backup).to.exist;
            expect(handler.backup).to.have.property("backup");
            expect(handler.backup).to.have.property("restore");
        });

        it("should have schemaVersion property", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.schemaVersion).to.exist;
            expect(handler.schemaVersion).to.have.property("migrationRecords");
        });

        it("should have cfg property", async () => {
            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.cfg).to.equal(config);
        });
    });

    describe("locking configuration", () => {
        it("should handle custom locking timeout", async () => {
            config.locking = new LockingConfig();
            config.locking.enabled = true;
            config.locking.timeout = 120000; // 2 minutes

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.lockingService).to.exist;
        });

        it("should respect locking disabled flag", async () => {
            config.locking = new LockingConfig();
            config.locking.enabled = false;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.lockingService).to.be.undefined;
        });

        it("should handle locking with undefined shift", async () => {
            config.shift = undefined;
            config.locking = new LockingConfig();
            config.locking.enabled = true;

            const handler = await FirebaseHandler.getInstance(config);

            expect(handler.lockingService).to.exist;
        });
    });
});
