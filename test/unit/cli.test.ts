import { expect } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("package metadata", () => {
    const packagePath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

    it("exposes the Firebase CLI executable", () => {
        expect(packageJson.bin["msr-firebase"]).to.equal("./dist/src/cli.js");
    });

    it("exposes the package entry point", () => {
        expect(packageJson.main).to.equal("dist/index.js");
    });
});
