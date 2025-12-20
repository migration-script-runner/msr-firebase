import { expect } from "chai";
import { LockingConfig } from "@migration-script-runner/core";
import { FirebaseRunner, FirebaseConfig, FirebaseLockingService } from "../../src";

/**
 * Integration tests for concurrent migration locking.
 *
 * Simulates real-world scenarios where multiple instances (pods, containers, servers)
 * attempt to run migrations simultaneously.
 *
 * These tests verify that:
 * - Only one instance can hold the migration lock at a time
 * - Lock prevents race conditions in distributed deployments
 * - Expired locks are cleaned up automatically
 * - Force release works correctly
 */
describe("Concurrent Migration Locking Integration", () => {
    const shift = `/lock-test-${Date.now()}`;
    let config: FirebaseConfig;

    before(() => {
        // Shared configuration for all test instances
        config = new FirebaseConfig();
        config.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            `${process.cwd()}/test/resources/fake-service-account.json`;
        config.databaseUrl = process.env.DATABASE_URL || "http://localhost:9000?ns=test-integration";
        config.shift = shift;
        config.tableName = "schema_version";
        config.folder = `${process.cwd()}/test/integration/migrations`;

        // Enable locking with short timeout for faster tests
        config.locking = new LockingConfig({
            enabled: true,
            timeout: 5000, // 5 seconds for testing
            tableName: 'migration_locks',
            retryAttempts: 0, // Fail fast for tests
            retryDelay: 1000
        });
    });

    after(async function() {
        this.timeout(10000);
        // Cleanup: remove all test data
        const cleanupConfig = new FirebaseConfig();
        cleanupConfig.applicationCredentials = config.applicationCredentials;
        cleanupConfig.databaseUrl = config.databaseUrl;
        cleanupConfig.shift = shift;

        const cleanupRunner = await FirebaseRunner.getInstance({ config: cleanupConfig });
        await cleanupRunner.getHandler().db.database.ref(shift).remove();
    });

    describe("Concurrent Migration Execution", () => {
        it("should prevent two instances from running migrations simultaneously", async function() {
            this.timeout(30000);

            // Create two independent runner instances (simulating two pods/containers)
            // Add small delay to avoid Firebase app name collision
            const runner1 = await FirebaseRunner.getInstance({ config });
            await new Promise(resolve => setTimeout(resolve, 10));
            const runner2 = await FirebaseRunner.getInstance({ config });

            // Both instances try to run migrations at the exact same time
            const results = await Promise.allSettled([
                runner1.migrate(),
                runner2.migrate()
            ]);

            // Extract results
            const result1 = results[0];
            const result2 = results[1];

            console.log("Result 1:", result1);
            console.log("Result 2:", result2);

            // CRITICAL ASSERTION: Exactly one should succeed, one should fail with lock error
            const successCount = results.filter(r =>
                r.status === 'fulfilled' && r.value && 'success' in r.value && r.value.success
            ).length;
            const failureCount = results.filter(r => r.status === 'rejected').length;

            console.log(`Success: ${successCount}, Failed: ${failureCount}`);

            // One must succeed (acquired lock), one must fail (couldn't acquire lock)
            expect(successCount).to.equal(1, "Exactly one instance should successfully acquire the lock");
            expect(failureCount).to.equal(1, "Exactly one instance should fail to acquire the lock");

            // Verify the successful one actually ran migrations
            if (result1.status === 'fulfilled' && result1.value.success) {
                expect(result1.value.executed.length).to.be.greaterThan(0);
            } else if (result2.status === 'fulfilled' && result2.value.success) {
                expect(result2.value.executed.length).to.be.greaterThan(0);
            }

            // Verify the failed one has a lock-related error message
            const failedResult = result1.status === 'rejected' ? result1 : result2;
            if (failedResult.status === 'rejected') {
                const errorMessage = failedResult.reason?.message || String(failedResult.reason);
                expect(errorMessage.toLowerCase()).to.match(/lock|already running|concurrent/i);
            }
        });

        it("should allow second instance to migrate after first completes", async function() {
            this.timeout(30000);

            // First instance runs migrations
            const runner1 = await FirebaseRunner.getInstance({ config });
            const result1 = await runner1.migrate();
            expect(result1.success).to.be.true;

            // Wait a moment to ensure lock is released
            await new Promise(resolve => setTimeout(resolve, 500));

            // Second instance should be able to run now (no pending migrations, but shouldn't fail with lock error)
            const runner2 = await FirebaseRunner.getInstance({ config });
            const result2 = await runner2.migrate();
            expect(result2.success).to.be.true;
            // No migrations to run, but should not throw lock error
            expect(result2.executed.length).to.equal(0);
        });
    });

    describe("Lock Expiration and Recovery", () => {
        it("should acquire lock after previous lock expires", async function() {
            this.timeout(30000);

            // Create config with very short timeout
            const shortTimeoutConfig = new FirebaseConfig();
            shortTimeoutConfig.applicationCredentials = config.applicationCredentials;
            shortTimeoutConfig.databaseUrl = config.databaseUrl;
            shortTimeoutConfig.shift = config.shift;
            shortTimeoutConfig.tableName = config.tableName;
            shortTimeoutConfig.folder = config.folder;
            shortTimeoutConfig.locking = new LockingConfig({
                enabled: true,
                timeout: 2000, // 2 seconds
                tableName: 'migration_locks',
                retryAttempts: 0,
                retryDelay: 1000
            });

            // First instance acquires lock
            const runner1 = await FirebaseRunner.getInstance({ config: shortTimeoutConfig });
            const handler1 = runner1.getHandler();
            const lockService1 = handler1.lockingService as FirebaseLockingService;

            const executorId1 = `test-executor-1-${Date.now()}`;
            const acquired1 = await lockService1.acquireLock(executorId1);
            expect(acquired1).to.be.true;

            // Wait for lock to expire (2 seconds + buffer)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Second instance should be able to acquire the expired lock
            const runner2 = await FirebaseRunner.getInstance({ config: shortTimeoutConfig });
            const handler2 = runner2.getHandler();
            const lockService2 = handler2.lockingService as FirebaseLockingService;

            const executorId2 = `test-executor-2-${Date.now()}`;
            const acquired2 = await lockService2.acquireLock(executorId2);
            expect(acquired2).to.be.true;

            // Verify second instance owns the lock
            const verified = await lockService2.verifyLockOwnership(executorId2);
            expect(verified).to.be.true;

            // Cleanup
            await lockService2.releaseLock(executorId2);
        });

        it("should automatically clean up expired lock during acquisition", async function() {
            this.timeout(20000);

            // Create config with very short timeout
            const shortTimeoutConfig = new FirebaseConfig();
            shortTimeoutConfig.applicationCredentials = config.applicationCredentials;
            shortTimeoutConfig.databaseUrl = config.databaseUrl;
            shortTimeoutConfig.shift = config.shift;
            shortTimeoutConfig.tableName = config.tableName;
            shortTimeoutConfig.folder = config.folder;
            shortTimeoutConfig.locking = new LockingConfig({
                enabled: true,
                timeout: 1000, // 1 second
                tableName: 'migration_locks',
                retryAttempts: 0,
                retryDelay: 1000
            });

            const runner1 = await FirebaseRunner.getInstance({ config: shortTimeoutConfig });
            const handler1 = runner1.getHandler();
            const lockService1 = handler1.lockingService as FirebaseLockingService;

            // First executor acquires lock
            const executorId1 = `expired-test-1-${Date.now()}`;
            await lockService1.acquireLock(executorId1);

            // Verify lock status shows lock is active
            let status = await lockService1.getLockStatus();
            expect(status).to.not.be.null;
            expect(status?.lockedBy).to.equal(executorId1);

            // Wait for lock to expire
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check status - should return null for expired lock
            status = await lockService1.getLockStatus();
            expect(status).to.be.null;

            // Second executor should acquire lock (expired lock gets cleaned up atomically)
            const runner2 = await FirebaseRunner.getInstance({ config: shortTimeoutConfig });
            const handler2 = runner2.getHandler();
            const lockService2 = handler2.lockingService as FirebaseLockingService;

            const executorId2 = `expired-test-2-${Date.now()}`;
            const acquired = await lockService2.acquireLock(executorId2);
            expect(acquired).to.be.true;

            // Verify new lock is owned by executor2
            status = await lockService2.getLockStatus();
            expect(status?.lockedBy).to.equal(executorId2);

            // Cleanup
            await lockService2.releaseLock(executorId2);
        });
    });

    describe("Lock Status and Management", () => {
        it("should report accurate lock status", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // Initially, no lock should exist
            let status = await lockService.getLockStatus();
            expect(status).to.be.null;

            // Acquire lock
            const executorId = `status-test-${Date.now()}`;
            await lockService.acquireLock(executorId);

            // Status should show lock details
            status = await lockService.getLockStatus();
            expect(status).to.not.be.null;
            expect(status?.isLocked).to.be.true;
            expect(status?.lockedBy).to.equal(executorId);
            expect(status?.lockedAt).to.be.instanceof(Date);
            expect(status?.expiresAt).to.be.instanceof(Date);

            // Release lock
            await lockService.releaseLock(executorId);

            // Status should be null again
            status = await lockService.getLockStatus();
            expect(status).to.be.null;
        });

        it("should force release lock unconditionally", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // Executor 1 acquires lock
            const executorId1 = `force-test-1-${Date.now()}`;
            await lockService.acquireLock(executorId1);

            // Verify lock exists
            let status = await lockService.getLockStatus();
            expect(status?.lockedBy).to.equal(executorId1);

            // Force release (simulating admin intervention)
            await lockService.forceReleaseLock();

            // Lock should be gone
            status = await lockService.getLockStatus();
            expect(status).to.be.null;

            // Another executor should be able to acquire lock now
            const executorId2 = `force-test-2-${Date.now()}`;
            const acquired = await lockService.acquireLock(executorId2);
            expect(acquired).to.be.true;

            // Cleanup
            await lockService.releaseLock(executorId2);
        });

        it("should not release lock owned by another executor", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            // Executor 1 acquires lock
            const executorId1 = `owner-test-1-${Date.now()}`;
            await lockService.acquireLock(executorId1);

            // Executor 2 tries to release it (should not work)
            const executorId2 = `owner-test-2-${Date.now()}`;
            await lockService.releaseLock(executorId2);

            // Lock should still exist and be owned by executor 1
            const status = await lockService.getLockStatus();
            expect(status?.lockedBy).to.equal(executorId1);

            // Cleanup
            await lockService.releaseLock(executorId1);
        });
    });

    describe("Lock Verification", () => {
        it("should verify lock ownership correctly", async function() {
            this.timeout(10000);

            const runner = await FirebaseRunner.getInstance({ config });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            const executorId = `verify-test-${Date.now()}`;

            // Before acquiring, verification should fail
            let verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.false;

            // Acquire lock
            await lockService.acquireLock(executorId);

            // Now verification should succeed
            verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.true;

            // Different executor should fail verification
            const otherExecutorId = `verify-other-${Date.now()}`;
            verified = await lockService.verifyLockOwnership(otherExecutorId);
            expect(verified).to.be.false;

            // Cleanup
            await lockService.releaseLock(executorId);

            // After release, verification should fail
            verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.false;
        });

        it("should fail verification for expired lock", async function() {
            this.timeout(10000);

            // Config with very short timeout
            const shortTimeoutConfig = new FirebaseConfig();
            shortTimeoutConfig.applicationCredentials = config.applicationCredentials;
            shortTimeoutConfig.databaseUrl = config.databaseUrl;
            shortTimeoutConfig.shift = config.shift;
            shortTimeoutConfig.tableName = config.tableName;
            shortTimeoutConfig.folder = config.folder;
            shortTimeoutConfig.locking = new LockingConfig({
                enabled: true,
                timeout: 1000, // 1 second
                tableName: 'migration_locks',
                retryAttempts: 0,
                retryDelay: 1000
            });

            const runner = await FirebaseRunner.getInstance({ config: shortTimeoutConfig });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            const executorId = `verify-expire-${Date.now()}`;

            // Acquire lock
            await lockService.acquireLock(executorId);

            // Should be valid initially
            let verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.true;

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verification should fail for expired lock
            verified = await lockService.verifyLockOwnership(executorId);
            expect(verified).to.be.false;
        });
    });

    describe("Real-World Scenarios", () => {
        it("should simulate Kubernetes multi-pod deployment", async function() {
            this.timeout(40000);

            // Simulate 5 pods starting simultaneously and all trying to run migrations
            const podCount = 5;
            const runners: FirebaseRunner[] = [];

            // Create instances with small delays to avoid Firebase app name collisions
            for (let i = 0; i < podCount; i++) {
                const runner = await FirebaseRunner.getInstance({ config });
                runners.push(runner);
                // Small delay to ensure unique app names
                if (i < podCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // All pods try to migrate simultaneously
            const migrationPromises = runners.map((runner) =>
                runner.migrate().catch(error => ({
                    error: error.message || String(error)
                }))
            );

            const results = await Promise.allSettled(migrationPromises);

            // Count successes and failures
            const successfulPods = results.filter(r =>
                r.status === 'fulfilled' &&
                typeof r.value === 'object' &&
                'success' in r.value
            ).length;

            const failedPods = results.filter(r =>
                r.status === 'rejected' ||
                (r.status === 'fulfilled' && 'error' in r.value)
            ).length;

            // Exactly one pod should succeed
            expect(successfulPods).to.equal(1, "Exactly one pod should successfully run migrations");
            expect(failedPods).to.equal(podCount - 1, "All other pods should fail to acquire lock");

            console.log(`Kubernetes simulation: ${successfulPods} succeeded, ${failedPods} blocked by lock`);
        });

        it("should handle rapid sequential migrations from different instances", async function() {
            this.timeout(30000);

            // Simulate continuous deployment where new pods come online in quick succession
            const instanceCount = 3;
            const results = [];

            for (let i = 0; i < instanceCount; i++) {
                const runner = await FirebaseRunner.getInstance({ config });

                try {
                    const result = await runner.migrate();
                    results.push({ instance: i, success: true, executed: result.executed.length });
                } catch (error) {
                    results.push({ instance: i, success: false, error: String(error) });
                }

                // Small delay between instances
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // First instance should succeed (even if no migrations to run)
            expect(results[0].success).to.be.true;

            // Subsequent instances should also succeed (no lock contention as previous completed)
            results.forEach((result) => {
                expect(result.success).to.be.true;
                // After first migration, others will have 0 pending
            });

            console.log("Sequential deployment results:", results);
        });

        it("should handle 20 concurrent instances with only one acquiring lock (stress test)", async function() {
            this.timeout(60000);

            // EXTREME STRESS TEST: Simulate massive concurrent deployment scenario
            // 20 instances all trying to migrate at exactly the same time
            const instanceCount = 20;
            const testShift = `/stress-test-${Date.now()}`;

            // Create separate config for this test to avoid interference
            const stressConfig = new FirebaseConfig();
            stressConfig.applicationCredentials = config.applicationCredentials;
            stressConfig.databaseUrl = config.databaseUrl;
            stressConfig.shift = testShift;
            stressConfig.tableName = config.tableName;
            stressConfig.folder = config.folder;
            stressConfig.locking = new LockingConfig({
                enabled: true,
                timeout: 10000, // 10 seconds
                tableName: 'migration_locks',
                retryAttempts: 0, // Fail fast - no retries
                retryDelay: 1000
            });

            console.log(`\n🚀 Creating ${instanceCount} concurrent MSR Firebase instances...`);

            // Create all runner instances
            const runners: FirebaseRunner[] = [];
            for (let i = 0; i < instanceCount; i++) {
                const runner = await FirebaseRunner.getInstance({ config: stressConfig });
                runners.push(runner);
                // Tiny delay to avoid Firebase app name collisions
                if (i < instanceCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }

            console.log(`✅ All ${instanceCount} instances created. Starting simultaneous migration attempts...`);

            // ALL 20 INSTANCES TRY TO MIGRATE AT THE EXACT SAME TIME
            const migrationPromises = runners.map((runner, index) =>
                runner.migrate()
                    .then(result => ({
                        index,
                        status: 'success',
                        executed: result.executed.length,
                        success: result.success
                    }))
                    .catch(error => ({
                        index,
                        status: 'failed',
                        error: error.message || String(error)
                    }))
            );

            const results = await Promise.all(migrationPromises);

            // Count successes and failures with type guards
            const successfulInstances = results.filter((r): r is { index: number; status: 'success'; executed: number; success: boolean } =>
                r.status === 'success' && 'success' in r && r.success
            );
            const failedInstances = results.filter((r): r is { index: number; status: 'failed'; error: string } =>
                r.status === 'failed'
            );

            console.log(`\n📊 STRESS TEST RESULTS:`);
            console.log(`   ✅ Successful: ${successfulInstances.length}`);
            console.log(`   ❌ Failed (lock blocked): ${failedInstances.length}`);
            console.log(`   📝 Total: ${results.length}`);

            // CRITICAL ASSERTIONS
            expect(successfulInstances.length).to.equal(
                1,
                `Expected exactly 1 instance to succeed, but ${successfulInstances.length} succeeded`
            );

            expect(failedInstances.length).to.equal(
                instanceCount - 1,
                `Expected ${instanceCount - 1} instances to fail, but ${failedInstances.length} failed`
            );

            // Verify the successful instance actually executed migrations
            const winner = successfulInstances[0];
            console.log(`\n🏆 Winner: Instance #${winner.index} acquired lock and executed ${winner.executed} migration(s)`);
            expect(winner.executed).to.be.greaterThan(0, "Winner should have executed at least one migration");

            // Verify all failures are lock-related
            failedInstances.forEach((failure) => {
                const errorMsg = failure.error.toLowerCase();
                expect(errorMsg).to.match(
                    /lock|already running|concurrent|acquire/i,
                    `Instance #${failure.index} failed with unexpected error: ${failure.error}`
                );
            });

            console.log(`\n✅ Lock mechanism successfully prevented race conditions across ${instanceCount} concurrent instances!`);

            // Cleanup
            const cleanupRunner = await FirebaseRunner.getInstance({ config: stressConfig });
            await cleanupRunner.getHandler().db.database.ref(testShift).remove();
        });
    });

    describe("Lock Path with Shift Prefix", () => {
        it("should create lock at correct path with shift prefix", async function() {
            this.timeout(10000);

            const customShift = `/custom-env-${Date.now()}`;
            const customConfig = new FirebaseConfig();
            customConfig.applicationCredentials = config.applicationCredentials;
            customConfig.databaseUrl = config.databaseUrl;
            customConfig.shift = customShift;
            customConfig.tableName = config.tableName;
            customConfig.folder = config.folder;
            customConfig.locking = config.locking;

            const runner = await FirebaseRunner.getInstance({ config: customConfig });
            const handler = runner.getHandler();
            const lockService = handler.lockingService as FirebaseLockingService;

            const executorId = `shift-test-${Date.now()}`;
            await lockService.acquireLock(executorId);

            // Verify lock exists at correct path
            const lockRef = handler.db.database.ref(`${customShift}/migrations/_lock`);
            const snapshot = await lockRef.once('value');
            expect(snapshot.exists()).to.be.true;
            expect(snapshot.val().executorId).to.equal(executorId);

            // Cleanup
            await lockService.releaseLock(executorId);
            await handler.db.database.ref(customShift).remove();
        });
    });
});
