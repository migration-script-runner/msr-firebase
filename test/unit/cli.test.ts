import { expect } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CLI", () => {
    describe("cli.ts file", () => {
        it("should exist and be readable", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.be.a("string");
            expect(content.length).to.be.greaterThan(0);
        });

        it("should have shebang for executable", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.match(/^#!\/usr\/bin\/env node/);
        });

        it("should import createCLI from core", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("createCLI");
            expect(content).to.include("@migration-script-runner/core");
        });

        it("should import FirebaseRunner", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("FirebaseRunner");
        });

        it("should call program.parse", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("program.parse(process.argv)");
        });
    });

    describe("package.json configuration", () => {
        it("should have bin entry for msr-firebase", () => {
            const packagePath = join(__dirname, "../../package.json");
            const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

            expect(packageJson.bin).to.be.an("object");
            expect(packageJson.bin["msr-firebase"]).to.equal("./dist/src/cli.js");
        });

        it("should have correct main entry point", () => {
            const packagePath = join(__dirname, "../../package.json");
            const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

            expect(packageJson.main).to.equal("dist/index.js");
        });

        it("should have version field", () => {
            const packagePath = join(__dirname, "../../package.json");
            const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

            expect(packageJson.version).to.be.a("string");
            expect(packageJson.version).to.match(/^\d+\.\d+\.\d+$/);
        });
    });

    describe("CLI commands", () => {
        it("should define firebase:info command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include(".command('firebase:info')");
            expect(content).to.include("Show Firebase connection information");
        });

        it("should define firebase:test-connection command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include(".command('firebase:test-connection')");
            expect(content).to.include("Test Firebase database connection");
        });

        it("should define firebase:nodes command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include(".command('firebase:nodes')");
            expect(content).to.include("List all root nodes");
        });

        it("should define firebase:backup-nodes command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include(".command('firebase:backup-nodes')");
            expect(content).to.include("Backup specific Firebase nodes");
        });
    });

    describe("Lock management commands (provided by MSR Core)", () => {
        it("should use createCLI which provides lock:status command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            // Verify we're using createCLI which automatically adds lock commands
            expect(content).to.include("createCLI");
            expect(content).to.include("@migration-script-runner/core");
        });

        it("should use createCLI which provides lock:release command", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            // Verify we're using createCLI which automatically adds lock commands
            expect(content).to.include("createCLI");
            expect(content).to.include("@migration-script-runner/core");
        });

        it("should have FirebaseHandler with lockingService property", () => {
            const handlerPath = join(__dirname, "../../src/service/FirebaseHandler.ts");
            const content = readFileSync(handlerPath, "utf-8");
            // Verify handler has lockingService which is used by lock commands
            expect(content).to.include("lockingService");
        });
    });

    describe("Custom CLI flags (v0.8.3+)", () => {
        it("should define addCustomOptions callback", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("addCustomOptions:");
        });

        it("should register --database-url flag", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("--database-url <url>");
            expect(content).to.include("Firebase Realtime Database URL");
        });

        it("should register --credentials flag", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("--credentials <path>");
            expect(content).to.include("Path to service account key file");
        });

        it("should register --backup-mode flag", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("--backup-mode <mode>");
            expect(content).to.include("full, create_only, restore_only, manual");
        });

        it("should define extendFlags callback", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("extendFlags:");
        });

        it("should map flags.databaseUrl to config.databaseUrl", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("flags.databaseUrl");
            expect(content).to.include("config.databaseUrl = flags.databaseUrl");
        });

        it("should map flags.credentials to config.applicationCredentials", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("flags.credentials");
            expect(content).to.include("config.applicationCredentials = flags.credentials");
        });

        it("should map flags.backupMode to config.backupMode", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            expect(content).to.include("flags.backupMode");
            expect(content).to.include("config.backupMode");
        });

        it("should validate backup mode values", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            // Should validate against allowed backup modes
            expect(content).to.include("'full'");
            expect(content).to.include("'create_only'");
            expect(content).to.include("'restore_only'");
            expect(content).to.include("'manual'");
        });

        it("should handle optional flags gracefully", () => {
            const cliPath = join(__dirname, "../../src/cli.ts");
            const content = readFileSync(cliPath, "utf-8");
            // Should check if flags exist and are strings before mapping
            expect(content).to.include("if (flags.databaseUrl && typeof flags.databaseUrl === 'string')");
            expect(content).to.include("if (flags.credentials && typeof flags.credentials === 'string')");
            expect(content).to.include("if (flags.backupMode && typeof flags.backupMode === 'string')");
        });
    });
});
