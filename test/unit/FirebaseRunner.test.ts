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

    describe("getHandler", () => {
        it("should return FirebaseHandler instance", () => {
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

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const handler = runner.getHandler();

            expect(handler).to.eq(mockHandler);
        });
    });

    describe("listNodes", () => {
        it("should return empty array when no data exists", async () => {
            const mockSnapshot = {
                exists: sinon.stub().returns(false),
                val: sinon.stub().returns(null),
            };

            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
            };

            const mockDatabase = {
                ref: sinon.stub().returns(mockRef),
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
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const nodes = await runner.listNodes();

            expect(nodes).to.deep.equal([]);
        });

        it("should return array of node names when data exists", async () => {
            const mockSnapshot = {
                exists: sinon.stub().returns(true),
                val: sinon.stub().returns({
                    users: { user1: 'data' },
                    posts: { post1: 'data' },
                    schema_version: {},
                }),
            };

            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
            };

            const mockDatabase = {
                ref: sinon.stub().returns(mockRef),
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
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const nodes = await runner.listNodes();

            expect(nodes).to.have.lengthOf(3);
            expect(nodes).to.include('users');
            expect(nodes).to.include('posts');
            expect(nodes).to.include('schema_version');
        });

        it("should return empty array when data is not an object", async () => {
            const mockSnapshot = {
                exists: sinon.stub().returns(true),
                val: sinon.stub().returns("string data"),
            };

            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
            };

            const mockDatabase = {
                ref: sinon.stub().returns(mockRef),
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
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const nodes = await runner.listNodes();

            expect(nodes).to.deep.equal([]);
        });

        it("should use root path when shift is not defined", async () => {
            const mockSnapshot = {
                exists: sinon.stub().returns(false),
                val: sinon.stub().returns(null),
            };

            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
            };

            const refStub = sinon.stub().returns(mockRef);

            const mockDatabase = {
                ref: refStub,
            } as unknown as database.Database;

            const mockHandler = {
                db: {
                    database: mockDatabase,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: "http://localhost:9000",
                    shift: undefined,
                    tableName: "schema_version",
                    buildPath: sinon.stub().callsFake((path: string) => `/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            await runner.listNodes();

            sinon.assert.calledWith(refStub, '/');
        });
    });

    describe("backupNodes", () => {
        it("should backup existing nodes", async () => {
            const mockUsersSnapshot = {
                exists: sinon.stub().returns(true),
                val: sinon.stub().returns({ user1: { name: 'Alice' } }),
            };

            const mockPostsSnapshot = {
                exists: sinon.stub().returns(true),
                val: sinon.stub().returns({ post1: { title: 'First Post' } }),
            };

            const mockRef = sinon.stub();
            mockRef.onCall(0).returns({ once: sinon.stub().resolves(mockUsersSnapshot) });
            mockRef.onCall(1).returns({ once: sinon.stub().resolves(mockPostsSnapshot) });

            const mockDatabase = {
                ref: mockRef,
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
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const backup = await runner.backupNodes(['users', 'posts']);

            expect(backup).to.have.property('users');
            expect(backup).to.have.property('posts');
            expect(backup.users).to.deep.equal({ user1: { name: 'Alice' } });
            expect(backup.posts).to.deep.equal({ post1: { title: 'First Post' } });
        });

        it("should return null for non-existent nodes", async () => {
            const mockSnapshot = {
                exists: sinon.stub().returns(false),
                val: sinon.stub().returns(null),
            };

            const mockRef = {
                once: sinon.stub().resolves(mockSnapshot),
            };

            const mockDatabase = {
                ref: sinon.stub().returns(mockRef),
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
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const backup = await runner.backupNodes(['nonexistent']);

            expect(backup).to.have.property('nonexistent');
            expect(backup.nonexistent).to.be.null;
        });

        it("should handle empty node list", async () => {
            const mockHandler = {
                db: {
                    database: {} as database.Database,
                    checkConnection: sinon.stub().resolves(true),
                },
                cfg: {
                    databaseUrl: "http://localhost:9000",
                    shift: "/test",
                    tableName: "schema_version",
                    buildPath: sinon.stub().callsFake((path: string) => `/test/${path}`),
                },
                backup: {},
                schemaVersion: {},
                getName: sinon.stub().returns("Test Handler"),
            } as unknown as FirebaseHandler;

            const runner = new FirebaseRunner({ handler: mockHandler, config: getDefaultConfig() });
            const backup = await runner.backupNodes([]);

            expect(backup).to.deep.equal({});
        });
    });
});
