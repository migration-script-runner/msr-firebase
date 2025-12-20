import { expect } from "chai";
import sinon from "sinon";
import { SchemaVersionService } from "../../src/service/SchemaVersionService";
import { MigrationScriptService } from "../../src/service/MigrationScriptService";
import { FirebaseConfig } from "../../src/model";
import { database } from "firebase-admin";

describe("SchemaVersionService", () => {
    let service: SchemaVersionService;
    let mockMigrationService: MigrationScriptService;
    let config: FirebaseConfig;
    let mockRef: any;
    let mockSnapshot: any;

    beforeEach(() => {
        mockSnapshot = {
            exists: sinon.stub().returns(true),
            val: sinon.stub().returns({}),
        };

        mockRef = {
            set: sinon.stub().resolves(),
            once: sinon.stub().resolves(mockSnapshot),
        };

        const mockDatabase = {
            ref: sinon.stub().returns(mockRef),
        } as unknown as database.Database;

        mockMigrationService = {
            db: mockDatabase,
            getSnapshot: sinon.stub().resolves(mockSnapshot),
        } as unknown as MigrationScriptService;

        config = new FirebaseConfig();
        config.shift = "/test";
        config.tableName = "schema_version";

        service = new SchemaVersionService(mockMigrationService, config);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("constructor", () => {
        it("should initialize with migration records service", () => {
            expect(service.migrationRecords).to.equal(mockMigrationService);
        });
    });

    describe("createTable", () => {
        it("should create schema version node in Firebase", async () => {
            const result = await service.createTable("schema_version");

            expect(result).to.be.true;
            sinon.assert.calledOnce(mockRef.set);
            sinon.assert.calledWith(mockRef.set, {});
        });

        it("should use buildPath to construct node path", async () => {
            const buildPathSpy = sinon.spy(config, 'buildPath');

            await service.createTable("custom_migrations");

            sinon.assert.calledOnce(buildPathSpy);
            sinon.assert.calledWith(buildPathSpy, "custom_migrations");
        });
    });

    describe("isInitialized", () => {
        it("should return true when node exists", async () => {
            mockSnapshot.exists.returns(true);

            const result = await service.isInitialized("schema_version");

            expect(result).to.be.true;
        });

        it("should return false when node does not exist", async () => {
            mockSnapshot.exists.returns(false);

            const result = await service.isInitialized("schema_version");

            expect(result).to.be.false;
        });

        it("should check snapshot existence at correct path", async () => {
            const getSnapshotStub = mockMigrationService.getSnapshot as sinon.SinonStub;

            await service.isInitialized("my_migrations");

            sinon.assert.calledOnce(getSnapshotStub);
            sinon.assert.calledWith(getSnapshotStub, "/test/my_migrations");
        });
    });

    describe("validateTable", () => {
        it("should always return true for Firebase", async () => {
            const result = await service.validateTable("schema_version");

            expect(result).to.be.true;
        });
    });
});
