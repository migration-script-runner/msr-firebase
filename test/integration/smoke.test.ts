import { expect } from "chai";
import { Config } from "@migration-script-runner/core";
import { FirebaseRunner, FirebaseHandler, AppConfig } from "../../src";

describe("Smoke Test: Complete Migration Workflow", () => {
    let runner: FirebaseRunner;
    let handler: FirebaseHandler;
    const shift = `/smoke-test-${Date.now()}`;

    before(async function() {
        this.timeout(30000);

        // Setup configuration
        const appConfig = new AppConfig();
        appConfig.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            `${process.cwd()}/test/resources/fake-service-account.json`;
        appConfig.databaseUrl = process.env.DATABASE_URL || "http://localhost:9000?ns=test-integration";
        appConfig.shift = shift;
        appConfig.tableName = "schema_version";

        const config = new Config();
        config.folder = `${process.cwd()}/test/integration/migrations`;
        config.tableName = "schema_version";

        // Initialize handler and runner
        handler = await FirebaseHandler.getInstance(appConfig);
        runner = new FirebaseRunner({ handler, config });
    });

    after(async function() {
        this.timeout(10000);
        // Cleanup: remove all test data
        await handler.db.database.ref(shift).remove();
    });

    describe("1. Initial Setup and Connection", () => {
        it("should verify database connection", async () => {
            const isConnected = await handler.db.checkConnection();
            expect(isConnected).to.be.true;
        });

        it("should get connection info from FirebaseRunner", () => {
            const info = runner.getConnectionInfo();
            expect(info).to.have.property("databaseUrl");
            expect(info).to.have.property("shift", shift);
            expect(info).to.have.property("tableName", "schema_version");
        });

        it("should get database reference from FirebaseRunner", () => {
            const db = runner.getDatabase();
            expect(db).to.exist;
            expect(db.ref).to.be.a("function");
        });

        it("should list nodes (should be empty initially)", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.be.an("array");
        });
    });

    describe("2. Validate Migrations Before Running", () => {
        it("should validate all migration scripts", async function() {
            this.timeout(10000);
            const result = await runner.validate();
            expect(result.pending).to.be.an("array");
            expect(result.pending.length).to.be.greaterThan(0);
            // All should be valid
            result.pending.forEach(validation => {
                expect(validation.valid).to.be.true;
            });
        });
    });

    describe("3. Run First Two Migrations", () => {
        it("should run first 2 migrations", async function() {
            this.timeout(15000);
            const result = await runner.migrate(202501010002);
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(2);
        });

        it("should verify schema version table was created", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.include("schema_version");
        });

        it("should list executed migrations", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(2);
            expect(history[0].name).to.include("create_users");
            expect(history[1].name).to.include("create_posts");
        });

        it("should verify users data was created", async () => {
            const usersRef = handler.db.database.ref(handler.cfg.buildPath("users"));
            const snapshot = await usersRef.once("value");
            expect(snapshot.exists()).to.be.true;
            const users = snapshot.val();
            expect(users).to.have.property("user1");
            expect(users.user1.name).to.equal("Alice");
        });

        it("should verify posts data was created", async () => {
            const postsRef = handler.db.database.ref(handler.cfg.buildPath("posts"));
            const snapshot = await postsRef.once("value");
            expect(snapshot.exists()).to.be.true;
            const posts = snapshot.val();
            expect(posts).to.have.property("post1");
            expect(posts.post1.title).to.equal("First Post");
        });

        it("should list all root nodes including new data", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.include("users");
            expect(nodes).to.include("posts");
            expect(nodes).to.include("schema_version");
        });
    });

    describe("4. Backup Specific Nodes", () => {
        it("should backup users and posts nodes", async () => {
            const backup = await runner.backupNodes(["users", "posts"]);
            expect(backup).to.have.property("users");
            expect(backup).to.have.property("posts");
            expect(backup.users).to.have.property("user1");
            expect(backup.posts).to.have.property("post1");
        });

        it("should handle backup of non-existent nodes", async () => {
            const backup = await runner.backupNodes(["nonexistent"]);
            expect(backup).to.have.property("nonexistent", null);
        });
    });

    describe("5. Run Remaining Migrations", () => {
        it("should run remaining 2 migrations", async function() {
            this.timeout(15000);
            const result = await runner.migrate();
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(2);
        });

        it("should list all 4 executed migrations", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(4);
            expect(history[2].name).to.include("create_comments");
            expect(history[3].name).to.include("create_settings");
        });

        it("should verify comments data was created", async () => {
            const commentsRef = handler.db.database.ref(handler.cfg.buildPath("comments"));
            const snapshot = await commentsRef.once("value");
            expect(snapshot.exists()).to.be.true;
            const comments = snapshot.val();
            expect(comments).to.have.property("comment1");
        });

        it("should verify settings data was created", async () => {
            const settingsRef = handler.db.database.ref(handler.cfg.buildPath("settings"));
            const snapshot = await settingsRef.once("value");
            expect(snapshot.exists()).to.be.true;
            const settings = snapshot.val();
            expect(settings).to.have.property("app");
            expect(settings.app.name).to.equal("MSR Firebase Test");
        });

        it("should list all root nodes including all tables", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.include("users");
            expect(nodes).to.include("posts");
            expect(nodes).to.include("comments");
            expect(nodes).to.include("settings");
            expect(nodes).to.include("schema_version");
        });
    });

    describe("6. Verify No Pending Migrations", () => {
        it("should not run any migrations when all are applied", async function() {
            this.timeout(10000);
            const result = await runner.migrate();
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(0);
        });
    });

    describe("7. Transaction Support", () => {
        it("should support runTransaction from database", async () => {
            const result = await handler.db.runTransaction(async (db) => {
                // Read users
                const usersRef = db.ref(handler.cfg.buildPath("users/user1"));
                const snapshot = await usersRef.once("value");
                expect(snapshot.exists()).to.be.true;
                return "Transaction completed";
            });
            expect(result).to.equal("Transaction completed");
        });
    });

    describe("8. Backup and Restore", () => {
        let backupPath: string;

        it("should create full database backup", async function() {
            this.timeout(10000);
            backupPath = await runner.createBackup();
            expect(backupPath).to.be.a("string");
            expect(backupPath).to.match(/\.bkp$/);
        });

        it("should restore from last backup", async function() {
            this.timeout(10000);
            // Modify data first
            await handler.db.database.ref(handler.cfg.buildPath("users/user1/name")).set("Modified");

            // Verify data was modified
            let snapshot = await handler.db.database.ref(handler.cfg.buildPath("users/user1/name")).once("value");
            expect(snapshot.val()).to.equal("Modified");

            // Restore from last backup (doesn't require path parameter)
            await handler.backup.restore();

            // Verify data was restored to original value
            snapshot = await handler.db.database.ref(handler.cfg.buildPath("users/user1/name")).once("value");
            expect(snapshot.val()).to.equal("Alice");
        });

        it("should delete backup", async () => {
            await handler.backup.deleteBackup();
            // Note: deleteBackup() clears the in-memory backup data
        });
    });

    describe("9. Down Migration (Rollback)", () => {
        it("should rollback last migration (settings)", async function() {
            this.timeout(15000);
            const result = await runner.down(202501010003);
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(1);
        });

        it("should verify settings was removed", async () => {
            const settingsRef = handler.db.database.ref(handler.cfg.buildPath("settings"));
            const snapshot = await settingsRef.once("value");
            expect(snapshot.exists()).to.be.false;
        });

        it("should show only 3 migrations in history", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(3);
            expect(history.map(m => m.name)).to.not.include("create_settings");
        });

        it("should rollback two more migrations", async function() {
            this.timeout(15000);
            const result = await runner.down(202501010001);
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(2);
        });

        it("should verify comments and posts were removed", async () => {
            const commentsSnapshot = await handler.db.database.ref(handler.cfg.buildPath("comments")).once("value");
            expect(commentsSnapshot.exists()).to.be.false;

            const postsSnapshot = await handler.db.database.ref(handler.cfg.buildPath("posts")).once("value");
            expect(postsSnapshot.exists()).to.be.false;
        });

        it("should show only 1 migration in history", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(1);
            expect(history[0].name).to.include("create_users");
        });

        it("should still have users data", async () => {
            const usersRef = handler.db.database.ref(handler.cfg.buildPath("users"));
            const snapshot = await usersRef.once("value");
            expect(snapshot.exists()).to.be.true;
        });
    });

    describe("10. Re-run Migrations After Rollback", () => {
        it("should run migrations again after rollback", async function() {
            this.timeout(15000);
            const result = await runner.migrate();
            expect(result.success).to.be.true;
            expect(result.executed).to.have.lengthOf(3); // posts, comments, settings
        });

        it("should have all 4 migrations applied again", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(4);
        });

        it("should verify all data was recreated", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.include("users");
            expect(nodes).to.include("posts");
            expect(nodes).to.include("comments");
            expect(nodes).to.include("settings");
        });
    });

    describe("11. Final Verification", () => {
        it("should backup all current nodes", async () => {
            const backup = await runner.backupNodes(["users", "posts", "comments", "settings"]);
            expect(backup.users).to.exist;
            expect(backup.posts).to.exist;
            expect(backup.comments).to.exist;
            expect(backup.settings).to.exist;
        });

        it("should have correct schema version count", async () => {
            const history = await handler.schemaVersion.migrationRecords.getAllExecuted();
            expect(history).to.have.lengthOf(4);

            // Verify each migration has correct structure
            history.forEach(migration => {
                expect(migration).to.have.property("timestamp");
                expect(migration).to.have.property("name");
                expect(migration).to.have.property("startedAt");
                expect(migration).to.have.property("finishedAt");
            });
        });

        it("should list all nodes one final time", async () => {
            const nodes = await runner.listNodes();
            expect(nodes).to.have.lengthOf.at.least(5); // users, posts, comments, settings, schema_version
        });
    });
});
