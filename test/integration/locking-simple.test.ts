// @ts-nocheck - Disabling type checks for test convenience
import { expect } from "chai";
import { FirebaseRunner, FirebaseConfig, FirebaseLockingService } from "../../src";

/**
 * Simplified locking integration tests.
 * Tests the core locking mechanism without running full migrations.
 */
describe("Simple Locking Integration Tests", () => {
    const shift = `/simple-lock-test-${Date.now()}`;
    let config: FirebaseConfig;

    before(() => {
        config = new FirebaseConfig();
        config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            `${process.cwd()}/test/resources/fake-service-account.json`;
        config.databaseUrl = process.env.DATABASE_URL || "http://localhost:9000?ns=test-integration";
        config.shift = shift;
        config.tableName = "schema_version";
        config.folder = `${process.cwd()}/test/integration/migrations`;
        config.locking = {
            enabled: true,
            timeout: 5000
        };
    });

    after(async function() {
        this.timeout(10000);
        const cleanupConfig = new FirebaseConfig();
        cleanupConfig.applicationCredentials = config.applicationCredentials;
        cleanupConfig.databaseUrl = config.databaseUrl;
        cleanupConfig.shift = shift;

        const cleanupRunner = await FirebaseRunner.getInstance({ config: cleanupConfig });
        await cleanupRunner.getHandler().db.database.ref(shift).remove();
    });

    describe("Basic Lock Acquisition", () => {
        it("should acquire lock when no lock exists", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            const executorId = `executor-${Date.now()}`;
            const acquired = await lockService.acquireLock(executorId);

            expect(acquired).to.be.true;

            // Cleanup
            await lockService.releaseLock(executorId);
        });

        it("should prevent second executor from acquiring lock", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // First executor acquires lock
            const executorId1 = `executor1-${Date.now()}`;
            const acquired1 = await lockService.acquireLock(executorId1);
            expect(acquired1).to.be.true;

            // Second executor tries to acquire
            const executorId2 = `executor2-${Date.now()}`;
            const acquired2 = await lockService.acquireLock(executorId2);
            expect(acquired2).to.be.false;

            // Cleanup
            await lockService.releaseLock(executorId1);
        });

        it("should allow acquisition after lock is released", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // First executor acquires and releases
            const executorId1 = `executor1-${Date.now()}`;
            await lockService.acquireLock(executorId1);
            await lockService.releaseLock(executorId1);

            // Second executor should now be able to acquire
            const executorId2 = `executor2-${Date.now()}`;
            const acquired = await lockService.acquireLock(executorId2);
            expect(acquired).to.be.true;

            // Cleanup
            await lockService.releaseLock(executorId2);
        });
    });

    describe("Lock Expiration", () => {
        it("should allow acquisition of expired lock", async function() {
            this.timeout(15000);

            // Config with 2-second timeout
            const shortConfig = new FirebaseConfig();
            shortConfig.applicationCredentials = config.applicationCredentials;
            shortConfig.databaseUrl = config.databaseUrl;
            shortConfig.shift = shift;
            shortConfig.tableName = config.tableName;
            shortConfig.folder = config.folder;
            shortConfig.locking = {
                enabled: true,
                timeout: 2000 // 2 seconds
            };

            const runner = await FirebaseRunner.getInstance({ config: shortConfig });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // First executor acquires lock
            const executorId1 = `expiry1-${Date.now()}`;
            await lockService.acquireLock(executorId1);

            // Wait for lock to expire (2 seconds + buffer)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Second executor should acquire expired lock
            const executorId2 = `expiry2-${Date.now()}`;
            const acquired = await lockService.acquireLock(executorId2);
            expect(acquired).to.be.true;

            // Cleanup
            await lockService.releaseLock(executorId2);
        });
    });

    describe("Concurrent Lock Acquisition", () => {
        it("should handle two executors trying to acquire simultaneously", async function() {
            this.timeout(15000);

            // Create two separate runner instances
            const runner1 = await FirebaseRunner.getInstance({ config });
            await new Promise(resolve => setTimeout(resolve, 10)); // Avoid Firebase app name collision
            const runner2 = await FirebaseRunner.getInstance({ config });

            const handler1 = runner1.getHandler();
            const handler2 = runner2.getHandler();
            const lockService1 = handler1.lockingService as FirebaseLockingService;
            const lockService2 = handler2.lockingService as FirebaseLockingService;

            const executorId1 = `concurrent1-${Date.now()}`;
            const executorId2 = `concurrent2-${Date.now() + 1}`;

            // Both try to acquire at the same time
            const [acquired1, acquired2] = await Promise.all([
                lockService1.acquireLock(executorId1),
                lockService2.acquireLock(executorId2)
            ]);

            console.log(`Executor 1 acquired: ${acquired1}, Executor 2 acquired: ${acquired2}`);

            // Exactly one should succeed
            expect(acquired1 || acquired2).to.be.true;
            expect(acquired1 && acquired2).to.be.false;

            // Cleanup - release whoever got the lock
            if (acquired1) {
                await lockService1.releaseLock(executorId1);
            }
            if (acquired2) {
                await lockService2.releaseLock(executorId2);
            }
        });
    });

    describe("Lock Verification", () => {
        it("should verify lock ownership correctly", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            const executorId = `verify-${Date.now()}`;

            // Before acquiring
            let verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.false;

            // After acquiring
            await lockService.acquireLock(executorId);
            verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.true;

            // Different executor should fail
            const otherExecutorId = `other-${Date.now()}`;
            verified = await lockService.verifyLockOwnership(otherExecutorId);
            expect(verified).to.be.false;

            // Cleanup
            await lockService.releaseLock(executorId);

            // After release
            verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.false;
        });
    });

    describe("Lock Status", () => {
        it("should report lock status correctly", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // No lock initially
            let status = await lockService.getLockStatus();
            expect(status).to.be.null;

            // After acquiring
            const executorId = `status-${Date.now()}`;
            await lockService.acquireLock(executorId);

            status = await lockService.getLockStatus();
            expect(status).to.not.be.null;
            expect(status?.isLocked).to.be.true;
            expect(status?.lockedBy).to.equal(executorId);

            // Cleanup
            await lockService.releaseLock(executorId);

            // After release
            status = await lockService.getLockStatus();
            expect(status).to.be.null;
        });
    });
});
