import {expect} from "chai";
import {AppConfig} from "../../src";

describe("AppConfig", () => {

    describe("buildPath", () => {
        it("should build path with shift prefix", () => {
            const config = new AppConfig();
            config.shift = "/test-123";

            const path = config.buildPath("users");

            expect(path).eq("/test-123/users");
        });

        it("should handle empty path segment", () => {
            const config = new AppConfig();
            config.shift = "/test-123";

            const path = config.buildPath("");

            expect(path).eq("/test-123/");
        });

        it("should handle nested paths", () => {
            const config = new AppConfig();
            config.shift = "/test-123";

            const path = config.buildPath("users/profile");

            expect(path).eq("/test-123/users/profile");
        });

        it("should work with undefined shift", () => {
            const config = new AppConfig();
            config.shift = undefined;

            const path = config.buildPath("users");

            expect(path).eq("undefined/users");
        });
    });

    describe("getRoot", () => {
        it("should return shift with trailing slash", () => {
            const config = new AppConfig();
            config.shift = "/test-123";

            const root = config.getRoot();

            expect(root).eq("/test-123/");
        });

        it("should handle undefined shift", () => {
            const config = new AppConfig();
            config.shift = undefined;

            const root = config.getRoot();

            expect(root).eq("undefined/");
        });
    });

    describe("environment variables", () => {
        it("should read GOOGLE_APPLICATION_CREDENTIALS from env", () => {
            const originalValue = process.env.GOOGLE_APPLICATION_CREDENTIALS;

            // Set env var
            process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/to/credentials.json";

            const config = new AppConfig();

            expect(config.applicationCredentials).eq("/path/to/credentials.json");

            // Restore
            if (originalValue) {
                process.env.GOOGLE_APPLICATION_CREDENTIALS = originalValue;
            } else {
                delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
            }
        });

        it("should read DATABASE_URL from env", () => {
            const originalValue = process.env.DATABASE_URL;

            // Set env var
            process.env.DATABASE_URL = "http://localhost:9000";

            const config = new AppConfig();

            expect(config.databaseUrl).eq("http://localhost:9000");

            // Restore
            if (originalValue) {
                process.env.DATABASE_URL = originalValue;
            } else {
                delete process.env.DATABASE_URL;
            }
        });

        it("should use default tableName", () => {
            const config = new AppConfig();

            expect(config.tableName).eq("schema_version");
        });
    });
});
