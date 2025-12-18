import { ILockingService, ILockStatus, LockingConfig } from '@migration-script-runner/core';
import { IFirebaseDB } from '../interface';

/**
 * Lock data stored in Firebase Realtime Database.
 */
interface ILockData {
    executorId: string;
    lockedAt: number;
    expiresAt: number;
    hostname?: string;
    processId?: number | null;
}

/**
 * Custom error for lock-related operations.
 * Preserves the original error as the cause for better debugging.
 *
 * @example
 * ```typescript
 * try {
 *   await lockingService.acquireLock(executorId);
 * } catch (error) {
 *   if (error instanceof LockOperationError) {
 *     console.error('Lock operation failed:', error.message);
 *     if (error.cause) {
 *       console.error('Original error:', error.cause);
 *     }
 *   }
 * }
 * ```
 */
export class LockOperationError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'LockOperationError';

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LockOperationError);
        }
    }
}

/**
 * Firebase Realtime Database implementation of migration locking.
 *
 * Prevents concurrent migrations by storing a lock record at `migrations/_lock` path
 * using Firebase transactions for atomicity.
 *
 * **Two-Phase Locking:**
 * 1. `acquireLock()` - Attempt to set lock using transaction
 * 2. `verifyLockOwnership()` - Confirm lock is still owned
 *
 * **Lock Storage:**
 * - Path: `{shift}/migrations/_lock` (configurable via shift)
 * - Data: `{ executorId, lockedAt, expiresAt, hostname, processId }`
 * - Atomic: Uses Firebase transactions for race-free acquisition
 *
 * @example
 * ```typescript
 * const lockingService = new FirebaseLockingService(
 *   firebaseDb,
 *   { timeout: 600000 } // 10 minutes
 * );
 *
 * const executorId = 'host-123-uuid';
 * const acquired = await lockingService.acquireLock(executorId);
 * if (acquired) {
 *   const verified = await lockingService.verifyLockOwnership(executorId);
 *   if (verified) {
 *     // Safe to run migrations
 *   }
 * }
 * ```
 */
export class FirebaseLockingService implements ILockingService<IFirebaseDB> {
    private readonly lockPath: string;
    private readonly timeout: number;

    /**
     * Creates a new FirebaseLockingService instance.
     *
     * @param db - Firebase database instance
     * @param lockingConfig - Locking configuration (timeout in milliseconds)
     * @param shift - Optional path prefix for lock location (default: '')
     */
    constructor(
        private readonly db: IFirebaseDB,
        lockingConfig?: LockingConfig,
        shift?: string
    ) {
        this.timeout = lockingConfig?.timeout ?? 600000; // Default 10 minutes
        const prefix = shift ? `${shift}/` : '';
        this.lockPath = `${prefix}migrations/_lock`;
    }

    /**
     * Attempt to acquire the migration lock.
     *
     * Uses Firebase transaction to atomically check and set the lock.
     * Only succeeds if no lock exists or existing lock is expired.
     * Expired lock cleanup is handled atomically within the transaction.
     *
     * @param executorId - Unique identifier (hostname-pid-uuid)
     * @returns true if lock acquired, false if already locked
     */
    async acquireLock(executorId: string): Promise<boolean> {
        const now = Date.now();
        const expiresAt = now + this.timeout;
        const parts = executorId.split('-');
        const hostname = parts[0] || '';
        const pidStr = parts[1];
        const processId = pidStr ? parseInt(pidStr, 10) : undefined;

        const lockRef = this.db.database.ref(this.lockPath);

        try {
            const result = await lockRef.transaction((currentLock: ILockData | null) => {
                // If no lock exists, create it
                if (!currentLock) {
                    return {
                        executorId,
                        lockedAt: now,
                        expiresAt,
                        hostname,
                        processId: processId !== undefined && !isNaN(processId) ? processId : null
                    };
                }

                // If lock exists but is expired, replace it (atomic cleanup)
                if (currentLock.expiresAt < now) {
                    return {
                        executorId,
                        lockedAt: now,
                        expiresAt,
                        hostname,
                        processId: processId !== undefined && !isNaN(processId) ? processId : null
                    };
                }

                // Lock exists and is not expired, abort transaction
                return undefined;
            });

            // Verify both committed and that we own the lock
            return result.committed && result.snapshot.val()?.executorId === executorId;
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to acquire lock: ${message}`, originalError);
        }
    }

    /**
     * Verify that this executor still owns the lock.
     *
     * Confirms the lock exists and belongs to this executor.
     * Critical safety check before executing migrations.
     * Uses a no-op transaction for atomic read consistency.
     *
     * @param executorId - Unique identifier to verify
     * @returns true if lock is still owned by this executor
     */
    async verifyLockOwnership(executorId: string): Promise<boolean> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);

            // Use no-op transaction for atomic read consistency
            const result = await lockRef.transaction((current) => current);
            const lockData = result.snapshot.val() as ILockData | null;

            if (!lockData) {
                return false;
            }

            const now = Date.now();

            // Check if lock belongs to this executor and hasn't expired
            return lockData.executorId === executorId && lockData.expiresAt > now;
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to verify lock ownership: ${message}`, originalError);
        }
    }

    /**
     * Release the migration lock.
     *
     * Only releases if this executor owns the lock.
     * Safe to call even if lock doesn't exist.
     *
     * @param executorId - Unique identifier of the executor
     */
    async releaseLock(executorId: string): Promise<void> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);

            await lockRef.transaction((currentLock: ILockData | null) => {
                // Only remove if this executor owns it
                if (currentLock?.executorId === executorId) {
                    return null; // null removes the lock
                }

                // Don't modify lock owned by someone else
                return currentLock;
            });
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to release lock: ${message}`, originalError);
        }
    }

    /**
     * Get current lock status.
     *
     * Used by CLI commands to display lock information.
     * Returns null for expired locks (treats them as no lock).
     *
     * @returns Current lock status or null if no lock exists or lock is expired
     */
    async getLockStatus(): Promise<ILockStatus | null> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);
            const snapshot = await lockRef.once('value');
            const lockData = snapshot.val() as ILockData | null;

            if (!lockData) {
                return null;
            }

            const now = Date.now();
            const isExpired = lockData.expiresAt < now;

            // Return null for expired locks (treat as no lock)
            if (isExpired) {
                return null;
            }

            return {
                isLocked: true,
                lockedBy: lockData.executorId,
                lockedAt: new Date(lockData.lockedAt),
                expiresAt: new Date(lockData.expiresAt),
                processId: lockData.processId?.toString()
            };
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to get lock status: ${message}`, originalError);
        }
    }

    /**
     * Force-release the migration lock.
     *
     * DANGEROUS: Removes lock unconditionally.
     * Use only when certain no migration is running.
     */
    async forceReleaseLock(): Promise<void> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);
            await lockRef.remove();
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to force-release lock: ${message}`, originalError);
        }
    }

    /**
     * Check for and clean up expired locks.
     *
     * Removes lock if it has expired.
     * Note: This is now redundant as acquireLock() handles expiration atomically.
     * Kept for backward compatibility and explicit cleanup use cases.
     */
    async checkAndReleaseExpiredLock(): Promise<void> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);
            const now = Date.now();

            await lockRef.transaction((currentLock: ILockData | null) => {
                // If lock exists and is expired, remove it
                if (currentLock && currentLock.expiresAt < now) {
                    return null;
                }

                // Otherwise, leave it unchanged
                return currentLock;
            });
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to check and release expired lock: ${message}`, originalError);
        }
    }

    /**
     * Initialize lock storage.
     *
     * For Firebase Realtime Database, this validates that the lock path
     * is accessible. Unlike SQL databases, no table creation is needed
     * as Firebase creates paths automatically on first write.
     *
     * **Note:** This method extends beyond the ILockingService interface.
     * See issue #67 for proposal to add this to MSR Core.
     *
     * @throws Error if lock path is not accessible
     */
    async initLockStorage(): Promise<void> {
        try {
            const lockRef = this.db.database.ref(this.lockPath);

            // Verify read access to lock path
            await lockRef.once('value');

            // Verify write access by attempting a transaction
            await lockRef.transaction((current) => current);
        } catch (error) {
            const originalError = error instanceof Error ? error : undefined;
            const message = error instanceof Error ? error.message : String(error);
            throw new LockOperationError(`Failed to initialize lock storage at ${this.lockPath}: ${message}`, originalError);
        }
    }

    /**
     * Ensure lock storage is accessible.
     *
     * Verifies that the database connection is active and the lock path
     * can be read and written to. Useful for pre-flight checks before
     * attempting migrations.
     *
     * **Note:** This method extends beyond the ILockingService interface.
     * See issue #67 for proposal to add this to MSR Core.
     *
     * @returns true if lock storage is accessible, false otherwise
     */
    async ensureLockStorageAccessible(): Promise<boolean> {
        try {
            // Check database connection first
            const isConnected = await this.db.checkConnection();
            if (!isConnected) {
                return false;
            }

            // Verify lock path access
            const lockRef = this.db.database.ref(this.lockPath);
            await lockRef.once('value');

            return true;
        } catch {
            return false;
        }
    }
}
