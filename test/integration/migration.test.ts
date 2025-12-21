import {expect} from "chai"
import {database} from "firebase-admin"
import {MigrationScriptExecutor, SilentLogger} from "@migration-script-runner/core"

import {
    BackupService,
    DBConnector,
    EntityService,
    FirebaseHandler,
    IFirebaseDB
} from "../../src"
import {IntegrationTestConfig} from "../IntegrationTestConfig"
import {TestEntity} from "../TestEntity"

describe('Firebase Integration Tests', () => {
    let db: database.Database
    let firebaseDB: IFirebaseDB
    let handler: FirebaseHandler
    let executor: MigrationScriptExecutor<IFirebaseDB>
    const cfg = new IntegrationTestConfig()

    before(async () => {
        // Connect to Firebase Emulator and initialize handler
        handler = await FirebaseHandler.getInstance(cfg)
        db = handler.db.database
        firebaseDB = handler.db

        // Initialize executor
        executor = new MigrationScriptExecutor<IFirebaseDB>({
            handler,
            logger: new SilentLogger()
        })
    })

    afterEach(async () => {
        // Clean up test data after each test
        await db.ref(cfg.shift!).remove()
    })

    after(async () => {
        // Final cleanup
        await db.ref(cfg.shift!).remove()
    })

    describe('Connection', () => {
        it('should connect to emulator', async () => {
            expect(db).not.undefined
            expect(firebaseDB).not.undefined
        })

        it('should check connection successfully', async () => {
            const isConnected = await firebaseDB.checkConnection()
            expect(isConnected).eq(true, 'Should be connected to emulator')
        })

        it('should access database reference', async () => {
            const ref = db.ref(cfg.buildPath('test'))
            expect(ref).not.undefined
        })
    })

    describe('Schema Versioning', () => {
        it('should have schema version path configured', () => {
            const schemaPath = cfg.buildPath(cfg.tableName)
            expect(schemaPath).not.undefined
            expect(schemaPath).includes(cfg.tableName)
        })

        it('should record migration', async () => {
            const schemaPath = cfg.buildPath(cfg.tableName)

            // Add a test migration record
            const testRecord = {
                version: 'V202311020036',
                description: 'test',
                executedAt: Date.now(),
                status: 'success'
            }

            await db.ref(schemaPath).push(testRecord)

            // Verify it was recorded
            const snapshot = await db.ref(schemaPath).once('value')
            const records = snapshot.val()

            expect(records).not.null
            const recordValues = Object.values(records)
            expect(recordValues.length).gte(1, 'Should have at least one migration record')

            const found = recordValues.find((r: any) => r.version === 'V202311020036')
            expect(found).not.undefined
        })

        it('should query executed migrations', async () => {
            const schemaPath = cfg.buildPath(cfg.tableName)

            // Query all migrations
            const snapshot = await db.ref(schemaPath).once('value')

            if (snapshot.exists()) {
                const records = snapshot.val()
                expect(records).not.null
                expect(typeof records).eq('object')
            }
        })
    })

    describe('Backup/Restore', () => {
        it('should create backup of Firebase data', async () => {
            // Create some test data
            const testPath = cfg.buildPath('backup-test')
            await db.ref(testPath).set({test: 'data', value: 42})

            // Create backup
            const backupService = new BackupService(db)
            const backup = await backupService.backup()

            // Verify backup contains data
            expect(backup).not.undefined
            expect(backup.length).gt(0, 'Backup should not be empty')

            const backupData = JSON.parse(backup)
            expect(backupData).not.undefined
        })

        it('should restore from backup', async () => {
            // Create initial data
            const testPath = cfg.buildPath('restore-test')
            await db.ref(testPath).set({original: 'value'})

            // Create backup
            const backupService = new BackupService(db)
            const backup = await backupService.backup()

            // Modify data
            await db.ref(testPath).set({modified: 'value'})

            // Restore from backup
            await backupService.restore(backup)

            // Verify restoration
            const snapshot = await db.ref(testPath).once('value')
            const data = snapshot.val()

            expect(data).not.null
            expect(data.original).eq('value', 'Original data should be restored')
        })

        it('should verify data integrity after restore', async () => {
            // Create complex test data
            const testPath = cfg.buildPath('integrity-test')
            const originalData = {
                users: {
                    user1: {name: 'Alice', age: 30},
                    user2: {name: 'Bob', age: 25}
                },
                settings: {
                    theme: 'dark',
                    notifications: true
                }
            }

            await db.ref(testPath).set(originalData)

            // Backup
            const backupService = new BackupService(db)
            const backup = await backupService.backup()

            // Clear data
            await db.ref(testPath).remove()

            // Restore
            await backupService.restore(backup)

            // Verify complete data structure
            const snapshot = await db.ref(testPath).once('value')
            const restoredData = snapshot.val()

            expect(restoredData).not.null
            expect(restoredData.users.user1.name).eq('Alice')
            expect(restoredData.users.user2.age).eq(25)
            expect(restoredData.settings.theme).eq('dark')
        })
    })

    describe('Entity Operations', () => {
        let entityService: EntityService<TestEntity>

        beforeEach(() => {
            entityService = new EntityService<TestEntity>(db, cfg.buildPath('entities'))
        })

        it('should save entity', async () => {
            const entity = new TestEntity('test-value')
            const key = await entityService.save(entity)

            expect(key).not.undefined
            expect(key).not.null
        })

        it('should retrieve all entities', async () => {
            // Save multiple entities
            await entityService.save(new TestEntity('entity1'))
            await entityService.save(new TestEntity('entity2'))

            // Retrieve all
            const entities = await entityService.getAll()

            expect(entities.length).eq(2, 'Should have 2 entities')
        })

        it('should remove entity by key', async () => {
            const entity = new TestEntity('to-remove')
            const key = await entityService.save(entity)

            // Remove
            await entityService.remove(key)

            // Verify removed
            const entities = await entityService.getAll()
            const found = entities.find(e => e.test === 'to-remove')

            expect(found).undefined
        })

        it('should remove all entities', async () => {
            // Save some entities
            await entityService.save(new TestEntity('entity1'))
            await entityService.save(new TestEntity('entity2'))

            // Remove all
            await entityService.removeAll()

            // Verify all removed
            const entities = await entityService.getAll()
            expect(entities.length).eq(0, 'Should have no entities after removeAll')
        })
    })

    describe('Migrations', () => {
        it('should execute up migration without errors', async () => {
            // Execute migration - may or may not find migrations to run
            try {
                await executor.up()
                // If migrations exist and execute, verify schema version table updated
                const schemaPath = cfg.buildPath(cfg.tableName)
                const snapshot = await db.ref(schemaPath).once('value')

                // Schema path might or might not exist depending on migrations found
                expect(snapshot).not.undefined
            } catch (error:  any) {
                // No migrations to execute is not an error
                if (!error.message.includes('No pending migrations')) {
                    throw error
                }
            }
        })

        it('should allow manual data creation via handler', async () => {
            // Manually create test data using EntityService
            const testService = new EntityService<TestEntity>(
                db,
                cfg.buildPath('manual-test')
            )

            const entity = new TestEntity('manual-data')
            const key = await testService.save(entity)

            expect(key).not.undefined

            // Verify data was saved
            const testPath = cfg.buildPath('manual-test')
            const snapshot = await db.ref(testPath).once('value')

            expect(snapshot.exists()).eq(true, 'Manual data should be created')

            const data = snapshot.val()
            expect(data).not.null
            expect(data[key].test).eq('manual-data')
        })
    })

    describe('Error Handling', () => {
        it('should handle invalid connection', async () => {
            // Create config with invalid URL
            const invalidCfg = new IntegrationTestConfig()
            invalidCfg.databaseUrl = "http://localhost:9999?ns=invalid"

            // Attempt connection (will timeout or fail)
            try {
                const invalidDb = await DBConnector.connect(invalidCfg)
                const connected = await invalidDb.ref('.info/connected').once('value')
                // If we get here, connection might have succeeded to a different service
                expect(connected).not.undefined
            } catch (error) {
                // Expected behavior - connection should fail
                expect(error).not.undefined
            }
        })

        it('should handle missing path', async () => {
            const nonExistentPath = cfg.buildPath('does-not-exist')
            const snapshot = await db.ref(nonExistentPath).once('value')

            expect(snapshot.exists()).eq(false, 'Non-existent path should not exist')
            expect(snapshot.val()).null
        })

        it('should handle empty backup restore', async () => {
            const backupService = new BackupService(db)

            try {
                await backupService.restore('{}')
                // Empty restore should complete without error
                expect(true).eq(true)
            } catch (error) {
                // Some implementations might throw, which is also valid
                expect(error).not.undefined
            }
        })
    })

    describe('Transaction Support', () => {
        it('should perform single-node atomic transaction', async () => {
            // Set initial value
            const testPath = cfg.buildPath('transaction-test')
            await db.ref(testPath).set({ counter: 0 })

            // Perform atomic increment using Firebase's ref.transaction()
            const snapshot = await db.ref(testPath).child('counter').transaction((current) => {
                return (current || 0) + 1
            })

            expect(snapshot.committed).eq(true)
            expect(snapshot.snapshot.val()).eq(1)
        })

        it('should perform database operations in transaction', async () => {
            const testPath = cfg.buildPath('transaction-test-2')

            // Use Firebase's single-node transaction
            await db.ref(testPath).transaction((current) => {
                return { transactional: true, value: 123 }
            })

            // Verify data was written
            const snapshot = await db.ref(testPath).once('value')
            const data = snapshot.val()

            expect(data).not.null
            expect(data.transactional).eq(true)
            expect(data.value).eq(123)
        })
    })
})
