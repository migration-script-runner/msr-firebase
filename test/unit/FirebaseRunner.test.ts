import { expect } from "chai";
import sinon from "sinon";
import { MigrationScriptExecutor, Config } from "@migration-script-runner/core";
import { FirebaseRunner } from "../../src/FirebaseRunner";
import { FirebaseHandler } from "../../src/service/FirebaseHandler";
import { database } from "firebase-admin";

describe("FirebaseRunner", () => {
    const getDefaultConfig = (): Config => {
        const config = new Config();
        config.folder = "./migrations";
        config.tableName = "schema_version";
        return config;
    };

    describe("inheritance", () => {
        it("should extend MigrationScriptExecutor", () => {
            // Verify prototype chain
            expect(FirebaseRunner.prototype).to.be.instanceOf(MigrationScriptExecutor);
        });
    });

    describe("constructor", () => {
        it("should create runner instance with handler and configuration", () => {
            const mockHandler = {
                db: {
                    database: {} as database.Database,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: "http://localhost:9000",
                    shift: "/test",
                    tableName: "schema_version",
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const config = getDefaultConfig();

            const runner = new FirebaseRunner({ handler: mockHandler, config });

            expect(runner).to.be.instanceOf(FirebaseRunner);
            expect(runner).to.be.instanceOf(MigrationScriptExecutor);
        });
    });

    describe("getConnectionInfo", () => {
        it("should return Firebase connection information", () => {
            const mockHandler = {
                db: {
                    database: {} as database.Database,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: "http://localhost:9000",
                    shift: "/test-path",
                    tableName: "schema_version",
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const info = runner.getConnectionInfo();

            expect(info).to.deep.equal({
                databaseUrl: "http://localhost:9000",
                shift: "/test-path",
                tableName: "schema_version",
            });
        });

        it("should handle undefined databaseUrl", () => {
            const mockHandler = {
                db: {
                    database: {} as database.Database,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: undefined,
                    shift: "/test",
                    tableName: "schema_version",
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const info = runner.getConnectionInfo();

            expect(info.databaseUrl).to.be.undefined;
            expect(info.shift).to.eq("/test");
            expect(info.tableName).to.eq("schema_version");
        });
    });

    describe("getDatabase", () => {
        it("should return Firebase database instance", () => {
            const mockDatabase = {
                ref: sinon.stub(),
            } as unknown as database.Database;

            const mockHandler = {
                db: {
                    database: mockDatabase,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: "http://localhost:9000",
                    shift: "/test",
                    tableName: "schema_version",
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const db = runner.getDatabase();

            expect(db).to.eq(mockDatabase);
            expect(db.ref).to.be.a("function");
        });
    });
});
