import { expect } from "chai";
import { execSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { version } from "../../package.json";

describe("CLI Integration Tests", () => {
    const cliPath = join(__dirname, "../../dist/src/cli.js");

    describe("--help flag", () => {
        it("should display help message", () => {
            const output = execSync(`node ${cliPath} --help`, { encoding: "utf-8" });

            expect(output).to.include("Usage: msr-firebase");
            expect(output).to.include("Firebase Realtime Database Migration Runner");
            expect(output).to.include("Options:");
            expect(output).to.include("Commands:");
        });

        it("should list all built-in commands", () => {
            const output = execSync(`node ${cliPath} --help`, { encoding: "utf-8" });

            expect(output).to.include("migrate");
            expect(output).to.include("list");
            expect(output).to.include("down");
            expect(output).to.include("validate");
            expect(output).to.include("backup");
        });

        it("should list lock commands inherited from MSR Core", () => {
            const output = execSync(`node ${cliPath} --help`, { encoding: "utf-8" });

            expect(output).to.include("lock:status");
            expect(output).to.include("lock:release");
        });

        it("should describe Firebase-specific options", () => {
            const output = execSync(`node ${cliPath} --help`, { encoding: "utf-8" });

            expect(output).to.include("--database-url <url>");
            expect(output).to.include("--credentials <path>");
            expect(output).to.include("--backup-mode <mode>");
            expect(output).to.match(/full, create_only,\s+restore_only, manual/);
        });

        it("should list all custom Firebase commands", () => {
            const output = execSync(`node ${cliPath} --help`, { encoding: "utf-8" });

            expect(output).to.include("firebase:info");
            expect(output).to.include("firebase:test-connection");
            expect(output).to.include("firebase:nodes");
            expect(output).to.include("firebase:backup-nodes");
        });
    });

    describe("--version flag", () => {
        it("should display version number", () => {
            const output = execSync(`node ${cliPath} --version`, { encoding: "utf-8" });

            expect(output).to.equal(`${version}\n`);
        });
    });

    describe("command help", () => {
        it("should show help for migrate command", () => {
            const output = execSync(`node ${cliPath} migrate --help`, { encoding: "utf-8" });

            expect(output).to.include("Run pending migrations");
        });

        it("should show help for list command", () => {
            const output = execSync(`node ${cliPath} list --help`, { encoding: "utf-8" });

            expect(output).to.include("List all migrations with status");
        });

        it("should show help for firebase:nodes command", () => {
            const output = execSync(`node ${cliPath} firebase:nodes --help`, { encoding: "utf-8" });

            expect(output).to.include("List all root nodes in Firebase database");
        });

        it("should show help for firebase:backup-nodes command", () => {
            const output = execSync(`node ${cliPath} firebase:backup-nodes --help`, { encoding: "utf-8" });

            expect(output).to.include("Backup specific Firebase nodes");
            expect(output).to.include("<nodes...>");
        });
    });

    describe("error handling", () => {
        it("should handle unknown command", () => {
            const result = spawnSync("node", [cliPath, "definitely-unknown-command"], { encoding: "utf-8" });

            expect(result.status).to.equal(1);
            expect(result.stderr).to.include("unknown command 'definitely-unknown-command'");
        });
    });
});
