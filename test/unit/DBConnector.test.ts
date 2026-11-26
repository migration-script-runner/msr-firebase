import { expect } from "chai";
import { resolve } from "node:path";
import { DBConnector, FirebaseConfig } from "../../src";

describe("DBConnector", () => {
    it("delegates service-account file loading to Firebase Admin", async () => {
        const config = new FirebaseConfig();
        config.applicationCredentials = resolve(
            process.cwd(),
            "test/resources/missing-service-account.json"
        );

        await expect(DBConnector.connect(config)).to.be.rejectedWith(
            Error,
            "Failed to parse service account json file"
        );
    });
});
