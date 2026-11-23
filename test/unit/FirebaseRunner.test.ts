import { expect } from "chai";
import sinon from "sinon";
import { MigrationScriptRunner, Config, IConfigLoader, TransactionMode } from "@migration-script-runner/core";
import { FirebaseRunner } from "../../src/FirebaseRunner";
import { FirebaseHandler } from "../../src/service/FirebaseHandler";
import { FirebaseConfig } from "../../src/model/FirebaseConfig";

interface TestSnapshot {
    exists(): boolean;
    val(): unknown;
}

interface TestReference {
    once(event: "value"): Promise<TestSnapshot>;
}

interface TestDatabase {
    ref(path?: string): TestReference;
}

interface TestHandlerConfig {
    databaseUrl?: string;
    shift?: string;
    tableName: string;
    buildPath(path: string): string;
}

interface TestHandler {
    db: {
        database: TestDatabase;
        checkConnection(): Promise<boolean>;
    };
    cfg: TestHandlerConfig;
    backup: object;
    schemaVersion: object;
    getName(): string;
}

function createTestRunner(handler: TestHandler): FirebaseRunner {
    const config = new Config();
    config.folder = "./migrations";
    config.tableName = "schema_version";

    // The production constructor is private; these tests isolate FirebaseRunner's public helper methods.
    return Reflect.construct(FirebaseRunner, [{ handler, config }]);
}

function createTestDatabase(
    snapshots: Record<string, TestSnapshot>,
    requestedPaths: string[] = []
): TestDatabase {
    return {
        ref(path = ""): TestReference {
            requestedPaths.push(path);

            return {
                once: async () => snapshots[path] ?? createSnapshot(null, false),
            };
        },
    };
}

function createSnapshot(value: unknown, exists = true): TestSnapshot {
    return {
        exists: () => exists,
        val: () => value,
    };
}

function createTestHandler(
    database: TestDatabase = createTestDatabase({}),
    configOverrides: Partial<TestHandlerConfig> = {}
): TestHandler {
    return {
        db: {
            database,
            checkConnection: async () => true,
        },
        cfg: {
            databaseUrl: "http://localhost:9000",
            shift: "/test",
            tableName: "schema_version",
            buildPath: (path) => `/test/${path}`,
            ...configOverrides,
        },
        backup: {},
        schemaVersion: {},
        getName: () => "Test Handler",
    };
}

function createFirebaseHandlerStub(config: FirebaseConfig): FirebaseHandler {
    const fixture = createTestHandler(createTestDatabase({}), {
        databaseUrl: config.databaseUrl,
        shift: config.shift,
        tableName: config.tableName,
    });
    const handler = Object.create(FirebaseHandler.prototype) as FirebaseHandler;

    Object.assign(handler, {
        cfg: config,
        db: fixture.db,
        backup: fixture.backup,
        schemaVersion: fixture.schemaVersion,
        getName: fixture.getName,
        getVersion: () => "test",
    });

    return handler;
}

describe("FirebaseRunner", () => {
    describe("inheritance", () => {
        it("extends MigrationScriptRunner", () => {
            expect(FirebaseRunner.prototype).to.be.instanceOf(MigrationScriptRunner);
        });
    });

    describe("getInstance", () => {
        it("resolves Core and Firebase environment configuration before creating the handler and runner", async () => {
            const originalEnvironment = {
                DATABASE_URL: process.env.DATABASE_URL,
                GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                MSR_FOLDER: process.env.MSR_FOLDER,
                MSR_SHOW_BANNER: process.env.MSR_SHOW_BANNER,
            };
            process.env.DATABASE_URL = "https://firebase.example.com";
            process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/to/service-account.json";
            process.env.MSR_FOLDER = "./core-migrations";
            process.env.MSR_SHOW_BANNER = "false";

            let handlerInstance: FirebaseHandler | undefined;
            const handlerStub = sinon.stub(FirebaseHandler, "getInstance").callsFake(async (config) => {
                expect(config).to.be.instanceOf(FirebaseConfig);
                expect(config.transaction.mode).to.equal(TransactionMode.NONE);
                expect(config.databaseUrl).to.equal("https://firebase.example.com");
                expect(config.applicationCredentials).to.equal("/path/to/service-account.json");
                expect(config.folder).to.equal("./core-migrations");
                handlerInstance = createFirebaseHandlerStub(config);
                return handlerInstance;
            });

            try {
                const runner = await FirebaseRunner.getInstance({});

                expect(runner.getHandler()).to.equal(handlerInstance);
            } finally {
                handlerStub.restore();
                for (const [name, value] of Object.entries(originalEnvironment)) {
                    if (value === undefined) {
                        delete process.env[name];
                    } else {
                        process.env[name] = value;
                    }
                }
            }
        });

        it("uses a custom config loader when no explicit config is supplied", async () => {
            let loaderCalled = false;
            let handlerConfig: FirebaseConfig | undefined;
            const configLoader: IConfigLoader<FirebaseConfig> = {
                load: (_overrides, _options, defaults) => {
                    loaderCalled = true;
                    expect(defaults).to.be.instanceOf(FirebaseConfig);
                    expect(defaults?.transaction.mode).to.equal(TransactionMode.NONE);
                    defaults!.databaseUrl = "https://custom-loader.example.com";
                    defaults!.folder = "./custom-migrations";
                    defaults!.showBanner = false;
                    return defaults!;
                },
                applyEnvironmentVariables: () => undefined,
            };
            const handlerStub = sinon.stub(FirebaseHandler, "getInstance").callsFake(async (config) => {
                handlerConfig = config;
                return createFirebaseHandlerStub(config);
            });

            try {
                const runner = await FirebaseRunner.getInstance({ configLoader });

                expect(loaderCalled).to.equal(true);
                expect(handlerConfig?.databaseUrl).to.equal("https://custom-loader.example.com");
                expect(handlerConfig?.folder).to.equal("./custom-migrations");
                expect(runner.getHandler().cfg).to.equal(handlerConfig);
            } finally {
                handlerStub.restore();
            }
        });

        it("uses an explicit config without invoking a custom config loader", async () => {
            const config = new FirebaseConfig();
            config.showBanner = false;
            let loaderCalled = false;
            let handlerConfig: FirebaseConfig | undefined;
            const configLoader: IConfigLoader<FirebaseConfig> = {
                load: () => {
                    loaderCalled = true;
                    throw new Error("Explicit config must skip loading");
                },
                applyEnvironmentVariables: () => undefined,
            };
            const handlerStub = sinon.stub(FirebaseHandler, "getInstance").callsFake(async (resolvedConfig) => {
                handlerConfig = resolvedConfig;
                return createFirebaseHandlerStub(resolvedConfig);
            });

            try {
                const runner = await FirebaseRunner.getInstance({ config, configLoader });

                expect(loaderCalled).to.equal(false);
                expect(handlerConfig).to.equal(config);
                expect(runner.getHandler().cfg).to.equal(config);
            } finally {
                handlerStub.restore();
            }
        });

        it("does not create the Firebase handler when config loading fails", async () => {
            const configLoader: IConfigLoader<FirebaseConfig> = {
                load: () => {
                    throw new Error("Configuration could not be loaded");
                },
                applyEnvironmentVariables: () => undefined,
            };
            const handlerStub = sinon.stub(FirebaseHandler, "getInstance");

            try {
                await expect(FirebaseRunner.getInstance({ configLoader }))
                    .to.be.rejectedWith("Configuration could not be loaded");

                sinon.assert.notCalled(handlerStub);
            } finally {
                handlerStub.restore();
            }
        });
    });

    describe("getConnectionInfo", () => {
        it("returns Firebase connection information", () => {
            const handler = createTestHandler();
            const runner = createTestRunner(handler);

            expect(runner.getConnectionInfo()).to.deep.equal({
                databaseUrl: "http://localhost:9000",
                shift: "/test",
                tableName: "schema_version",
            });
        });

        it("preserves an undefined database URL", () => {
            const handler = createTestHandler(createTestDatabase({}), { databaseUrl: undefined, shift: "/custom" });
            const runner = createTestRunner(handler);

            expect(runner.getConnectionInfo()).to.deep.equal({
                databaseUrl: undefined,
                shift: "/custom",
                tableName: "schema_version",
            });
        });
    });

    describe("getDatabase", () => {
        it("returns the configured Firebase database", () => {
            const database = createTestDatabase({});
            const runner = createTestRunner(createTestHandler(database));

            expect(runner.getDatabase()).to.equal(database);
        });
    });

    describe("getHandler", () => {
        it("returns the configured handler", () => {
            const handler = createTestHandler();
            const runner = createTestRunner(handler);

            expect(runner.getHandler()).to.equal(handler);
        });
    });

    describe("listNodes", () => {
        it("returns an empty list when the configured path does not exist", async () => {
            const database = createTestDatabase({ "/test": createSnapshot(null, false) });
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.listNodes()).to.deep.equal([]);
        });

        it("returns the root child names when data exists", async () => {
            const database = createTestDatabase({
                "/test": createSnapshot({
                    users: { user1: "data" },
                    posts: { post1: "data" },
                    schema_version: {},
                }),
            });
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.listNodes()).to.deep.equal(["users", "posts", "schema_version"]);
        });

        it("returns an empty list when the stored value is not an object", async () => {
            const database = createTestDatabase({ "/test": createSnapshot("string data") });
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.listNodes()).to.deep.equal([]);
        });

        it("reads from the database root when no shift is configured", async () => {
            const requestedPaths: string[] = [];
            const database = createTestDatabase({ "/": createSnapshot(null, false) }, requestedPaths);
            const handler = createTestHandler(database, { shift: undefined });
            const runner = createTestRunner(handler);

            await runner.listNodes();

            expect(requestedPaths).to.deep.equal(["/"]);
        });
    });

    describe("backupNodes", () => {
        it("returns data for existing nodes", async () => {
            const database = createTestDatabase({
                "/test/users": createSnapshot({ user1: { name: "Alice" } }),
                "/test/posts": createSnapshot({ post1: { title: "First Post" } }),
            });
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.backupNodes(["users", "posts"])).to.deep.equal({
                users: { user1: { name: "Alice" } },
                posts: { post1: { title: "First Post" } },
            });
        });

        it("returns null for nodes that do not exist", async () => {
            const database = createTestDatabase({ "/test/nonexistent": createSnapshot(null, false) });
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.backupNodes(["nonexistent"])).to.deep.equal({ nonexistent: null });
        });

        it("returns an empty object when no nodes are requested", async () => {
            const requestedPaths: string[] = [];
            const database = createTestDatabase({}, requestedPaths);
            const runner = createTestRunner(createTestHandler(database));

            expect(await runner.backupNodes([])).to.deep.equal({});
            expect(requestedPaths).to.deep.equal([]);
        });
    });
});
