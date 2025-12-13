import { Config } from '@migration-script-runner/core';

export class AppConfig extends Config {
    applicationCredentials: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    databaseUrl: string | undefined = process.env.DATABASE_URL;

    shift: string | undefined;
    tableName: string = 'schema_version';

    public getRoot() {
        return this.buildPath('');
    }

    public buildPath(path: string) {
        return `${this.shift}/${path}`;
    }
}