import {FirebaseConfig} from "../src";

export class IntegrationTestConfig extends FirebaseConfig {

    constructor() {
        super()
        // For emulator, we need valid service account credentials
        // Even though emulator doesn't validate them, firebase-admin still parses them
        this.applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            `${process.cwd()}/test/resources/fake-service-account.json`

        // Connect to local emulator
        this.databaseUrl = "http://localhost:9000?ns=test-integration"

        // Use timestamp-based path for test isolation
        this.shift = `/test-${Date.now()}`

        // Set migrations folder
        this.folder = `${process.cwd()}/test/resources/migrations`
    }
}
