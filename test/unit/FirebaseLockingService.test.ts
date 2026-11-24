import { expect } from "chai";
import sinon from "sinon";
import type { Database } from 'firebase-admin/database';
import { FirebaseLockingService, LockOperationError } from "../../src";
import { IFirebaseDB } from "../../src/interface";
import { LockingConfig } from "@migration-script-runner/core";

describe("FirebaseLockingService", () => {
    let mockDatabase: Database;
    let mockFirebaseDB: IFirebaseDB;
    let lockingService: FirebaseLockingService;
    let lockingConfig: LockingConfig;

    beforeEach(() => {
        lockingConfig = new LockingConfig();
        lockingConfig.timeout = 60000; // 1 minute for tests
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("constructor", () => {
        it("should create instance with default timeout", () => {
            mockFirebaseDB = {
                database: {} as Database,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };

            const service = new FirebaseLockingService(mockFirebaseDB);
            expect(service).to.be.instanceOf(FirebaseLockingService);
        });

        it("should create instance with custom timeout", () => {
            mockFirebaseDB = {
                database: {} as Database,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };

            const customConfig = new LockingConfig();
            customConfig.timeout = 120000;

            const service = new FirebaseLockingService(mockFirebaseDB, customConfig);
            expect(service).to.be.instanceOf(FirebaseLockingService);
        });

        it("should create instance with shift path", () => {
            mockFirebaseDB = {
                database: {} as Database,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };

            const service = new FirebaseLockingService(mockFirebaseDB, lockingConfig, "test");
            expect(service).to.be.instanceOf(FirebaseLockingService);
        });
    });

    describe("acquireLock", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should acquire lock when no lock exists", async () => {
            const runnerId = "host-123-uuid";
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(null);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const acquired = await lockingService.acquireLock(runnerId);

            expect(acquired).to.be.true;
            sinon.assert.calledOnce(mockDatabase.ref as sinon.SinonStub);
        });

        it("should parse hostname and process ID from a Core runner ID with a hyphenated hostname", async () => {
            const runnerId = "macbook-pro-12345-a1b2c3d4-e5f6-4789-8abc-def012345678";
            let lockData: Record<string, unknown> | undefined;
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: (currentLock: null) => Record<string, unknown>) => {
                    lockData = updateFn(null);
                    return { committed: true, snapshot: { val: () => lockData } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.acquireLock(runnerId);

            expect(lockData).to.include({
                runnerId,
                hostname: "macbook-pro",
                processId: 12345
            });
        });

        it("should store no process ID when the runner ID has no process segment", async () => {
            let lockData: Record<string, unknown> | undefined;
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: (currentLock: null) => Record<string, unknown>) => {
                    lockData = updateFn(null);
                    return { committed: true, snapshot: { val: () => lockData } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.acquireLock("hostname");

            expect(lockData).to.include({ runnerId: "hostname", hostname: "hostname", processId: null });
        });

        it("should not acquire lock when lock already exists", async () => {
            const existingLock = {
                runnerId: "other-runner",
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(existingLock);
                    return { committed: result !== undefined, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";
            const acquired = await lockingService.acquireLock(runnerId);

            expect(acquired).to.be.false;
        });

        it("should return false when a committed transaction has no resulting lock", async () => {
            const mockRef = {
                transaction: sinon.stub().resolves({ committed: true, snapshot: { val: () => null } })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const acquired = await lockingService.acquireLock("hostname-123-uuid");

            expect(acquired).to.be.false;
        });

        it("should acquire lock when existing lock is expired", async () => {
            const runnerId = "host-123-uuid";
            const expiredLock = {
                runnerId: "old-runner",
                lockedAt: Date.now() - 120000,
                expiresAt: Date.now() - 60000 // Expired
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(expiredLock);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const acquired = await lockingService.acquireLock(runnerId);

            expect(acquired).to.be.true;
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                transaction: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";

            try {
                await lockingService.acquireLock(runnerId);
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to acquire lock");
            }
        });

        it("should wrap non-Error transaction failures with a useful message", async () => {
            const mockRef = {
                transaction: sinon.stub().callsFake(() => Promise.reject("connection unavailable"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const error = await lockingService.acquireLock("host-123-uuid").catch((reason: unknown) => reason);

            expect(error).to.be.instanceOf(LockOperationError);
            expect(error).to.have.property("message", "Failed to acquire lock: connection unavailable");
            expect(error).to.have.property("cause", undefined);
        });
    });

    describe("verifyLockOwnership", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should return true when lock is owned by runner", async () => {
            const runnerId = "host-123-uuid";
            const lockData = {
                runnerId,
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(lockData);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const owned = await lockingService.verifyLockOwnership(runnerId);

            expect(owned).to.be.true;
        });

        it("should return false when no lock exists", async () => {
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(null);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";
            const owned = await lockingService.verifyLockOwnership(runnerId);

            expect(owned).to.be.false;
        });

        it("should return false when lock is owned by different runner", async () => {
            const lockData = {
                runnerId: "other-runner",
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(lockData);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";
            const owned = await lockingService.verifyLockOwnership(runnerId);

            expect(owned).to.be.false;
        });

        it("should return false when lock is expired", async () => {
            const runnerId = "host-123-uuid";
            const lockData = {
                runnerId,
                lockedAt: Date.now() - 120000,
                expiresAt: Date.now() - 60000 // Expired
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(lockData);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const owned = await lockingService.verifyLockOwnership(runnerId);

            expect(owned).to.be.false;
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                transaction: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";

            try {
                await lockingService.verifyLockOwnership(runnerId);
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to verify lock ownership");
            }
        });

        it("should wrap non-Error transaction failures", async () => {
            const mockRef = { transaction: sinon.stub().callsFake(() => Promise.reject("connection unavailable")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.verifyLockOwnership("host-123-uuid"))
                .to.be.rejectedWith(LockOperationError, "Failed to verify lock ownership: connection unavailable");
        });

    });

    describe("releaseLock", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should release lock when owned by runner", async () => {
            const runnerId = "host-123-uuid";
            const lockData = {
                runnerId,
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(lockData);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.releaseLock(runnerId);

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should not release lock owned by different runner", async () => {
            const runnerId = "host-123-uuid";
            const lockData = {
                runnerId: "other-runner",
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(lockData);
                    expect(result).to.deep.equal(lockData); // Should not modify
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.releaseLock(runnerId);

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should handle releasing non-existent lock", async () => {
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(null);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";
            await lockingService.releaseLock(runnerId);

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                transaction: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const runnerId = "host-123-uuid";

            try {
                await lockingService.releaseLock(runnerId);
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to release lock");
            }
        });

        it("should wrap non-Error transaction failures", async () => {
            const mockRef = { transaction: sinon.stub().callsFake(() => Promise.reject("connection unavailable")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.releaseLock("host-123-uuid"))
                .to.be.rejectedWith(LockOperationError, "Failed to release lock: connection unavailable");
        });

    });

    describe("getLockStatus", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should return lock status when lock exists", async () => {
            const lockData = {
                runnerId: "host-123-uuid",
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000,
                processId: 123
            };

            const mockSnapshot = { val: () => lockData };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const status = await lockingService.getLockStatus();

            expect(status).to.not.be.null;
            expect(status!.isLocked).to.be.true;
            expect(status!.lockedBy).to.equal(lockData.runnerId);
            expect(status!.processId).to.equal("123");
        });

        it("should report an unknown owner for an active legacy lock record", async () => {
            const lockData = {
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockSnapshot = { val: () => lockData };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const status = await lockingService.getLockStatus();

            expect(status).to.deep.equal({
                isLocked: true,
                lockedBy: null,
                lockedAt: new Date(lockData.lockedAt),
                expiresAt: new Date(lockData.expiresAt),
                processId: undefined
            });
        });

        it("should return null when no lock exists", async () => {
            const mockSnapshot = { val: () => null };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const status = await lockingService.getLockStatus();

            expect(status).to.be.null;
        });

        it("should return null when lock is expired", async () => {
            const lockData = {
                runnerId: "host-123-uuid",
                lockedAt: Date.now() - 120000,
                expiresAt: Date.now() - 60000 // Expired
            };

            const mockSnapshot = { val: () => lockData };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const status = await lockingService.getLockStatus();

            // Expired locks are treated as no lock
            expect(status).to.be.null;
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                once: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            try {
                await lockingService.getLockStatus();
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to get lock status");
            }
        });

        it("should wrap non-Error database failures", async () => {
            const mockRef = { once: sinon.stub().callsFake(() => Promise.reject("connection unavailable")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.getLockStatus())
                .to.be.rejectedWith(LockOperationError, "Failed to get lock status: connection unavailable");
        });

    });

    describe("forceReleaseLock", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should force release lock unconditionally", async () => {
            const mockRef = {
                remove: sinon.stub().resolves()
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.forceReleaseLock();

            sinon.assert.calledOnce(mockRef.remove);
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                remove: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            try {
                await lockingService.forceReleaseLock();
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to force-release lock");
            }
        });

        it("should wrap non-Error removal failures", async () => {
            const mockRef = { remove: sinon.stub().callsFake(() => Promise.reject("connection unavailable")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.forceReleaseLock())
                .to.be.rejectedWith(LockOperationError, "Failed to force-release lock: connection unavailable");
        });

    });

    describe("checkAndReleaseExpiredLock", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should remove expired lock", async () => {
            const expiredLock = {
                runnerId: "old-runner",
                lockedAt: Date.now() - 120000,
                expiresAt: Date.now() - 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(expiredLock);
                    expect(result).to.be.null; // Should be removed
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.checkAndReleaseExpiredLock();

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should not remove active lock", async () => {
            const activeLock = {
                runnerId: "active-runner",
                lockedAt: Date.now(),
                expiresAt: Date.now() + 60000
            };

            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(activeLock);
                    expect(result).to.deep.equal(activeLock); // Should remain unchanged
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.checkAndReleaseExpiredLock();

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should handle no lock gracefully", async () => {
            const mockRef = {
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(null);
                    expect(result).to.be.null;
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.checkAndReleaseExpiredLock();

            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should throw error on database failure", async () => {
            const mockRef = {
                transaction: sinon.stub().rejects(new Error("Database error"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            try {
                await lockingService.checkAndReleaseExpiredLock();
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to check and release expired lock");
            }
        });

        it("should wrap non-Error transaction failures", async () => {
            const mockRef = { transaction: sinon.stub().callsFake(() => Promise.reject("connection unavailable")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.checkAndReleaseExpiredLock())
                .to.be.rejectedWith(LockOperationError, "Failed to check and release expired lock: connection unavailable");
        });
    });

    describe("initLockStorage", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should initialize lock storage successfully", async () => {
            const mockSnapshot = { val: () => null };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
                transaction: sinon.stub().callsFake(async (updateFn: any) => {
                    const result = updateFn(null);
                    return { committed: true, snapshot: { val: () => result } };
                })
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await lockingService.initLockStorage();

            sinon.assert.calledOnce(mockRef.once);
            sinon.assert.calledOnce(mockRef.transaction);
        });

        it("should throw error if lock path is not accessible", async () => {
            const mockRef = {
                once: sinon.stub().rejects(new Error("Permission denied"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            try {
                await lockingService.initLockStorage();
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to initialize lock storage");
            }
        });

        it("should wrap non-Error read failures", async () => {
            const mockRef = { once: sinon.stub().callsFake(() => Promise.reject("permission denied")) };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            await expect(lockingService.initLockStorage())
                .to.be.rejectedWith(LockOperationError, "Failed to initialize lock storage at migrations/_lock: permission denied");
        });

        it("should throw error if transaction fails", async () => {
            const mockSnapshot = { val: () => null };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
                transaction: sinon.stub().rejects(new Error("Transaction failed"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            try {
                await lockingService.initLockStorage();
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.message).to.include("Failed to initialize lock storage");
            }
        });
    });

    describe("ensureLockStorageAccessible", () => {
        beforeEach(() => {
            mockDatabase = {} as Database;
            mockFirebaseDB = {
                database: mockDatabase,
                checkConnection: sinon.stub(),
                runTransaction: sinon.stub()
            };
            lockingService = new FirebaseLockingService(mockFirebaseDB, lockingConfig);
        });

        it("should return true when lock storage is accessible", async () => {
            (mockFirebaseDB.checkConnection as sinon.SinonStub).resolves(true);

            const mockSnapshot = { val: () => null };
            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot)
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const accessible = await lockingService.ensureLockStorageAccessible();

            expect(accessible).to.be.true;
        });

        it("should return false when database is not connected", async () => {
            (mockFirebaseDB.checkConnection as sinon.SinonStub).resolves(false);

            const accessible = await lockingService.ensureLockStorageAccessible();

            expect(accessible).to.be.false;
        });

        it("should return false when lock path is not accessible", async () => {
            (mockFirebaseDB.checkConnection as sinon.SinonStub).resolves(true);

            const mockRef = {
                once: sinon.stub().rejects(new Error("Permission denied"))
            };
            mockDatabase.ref = sinon.stub().returns(mockRef);

            const accessible = await lockingService.ensureLockStorageAccessible();

            expect(accessible).to.be.false;
        });

        it("should return false on any error", async () => {
            (mockFirebaseDB.checkConnection as sinon.SinonStub).rejects(new Error("Connection error"));

            const accessible = await lockingService.ensureLockStorageAccessible();

            expect(accessible).to.be.false;
        });
    });
});
