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

describe("FirebaseRunner", () => {
    describe("inheritance", () => {
        it("extends MigrationScriptRunner", () => {
            expect(FirebaseRunner.prototype).to.be.instanceOf(MigrationScriptRunner);
        });
    });

    describe("getInstance", () => {
        it("resolves Firebase configuration through Core before creating the handler", async () => {
            const phases: string[] = [];
            const resolvedConfig = new FirebaseConfig();
            resolvedConfig.databaseUrl = "https://firebase.example.com";
            const configLoader: IConfigLoader<FirebaseConfig> = {
                load: (_overrides, _options, defaults) => {
                    expect(defaults).to.be.instanceOf(FirebaseConfig);
                    expect(defaults?.transaction.mode).to.equal(TransactionMode.NONE);
                    phases.push("config");
                    return resolvedConfig;
                },
                applyEnvironmentVariables: () => undefined,
            };
            const handlerStub = sinon.stub(FirebaseHandler, "getInstance").callsFake(async (config) => {
                phases.push("handler");
                expect(config).to.equal(resolvedConfig);
                throw new Error("Stop before connecting to Firebase");
            });

            try {
                await expect(FirebaseRunner.getInstance({ configLoader }))
                    .to.be.rejectedWith("Stop before connecting to Firebase");

                expect(phases).to.deep.equal(["config", "handler"]);
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
