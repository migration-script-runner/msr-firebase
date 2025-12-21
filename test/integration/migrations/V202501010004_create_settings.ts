import { IRunnableScript, IMigrationInfo } from "@migration-script-runner/core";
import { IFirebaseDB } from "../../../src";
import { FirebaseHandler } from "../../../src/service/FirebaseHandler";

export default class CreateSettings implements IRunnableScript<IFirebaseDB> {
    async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("settings");
        const settingsRef = db.database.ref(path);

        await settingsRef.set({
            app: { name: "MSR Firebase Test", version: "1.0.0" },
            features: { comments: true, posts: true, users: true },
            limits: { maxUsers: 1000, maxPosts: 10000 }
        });

        return "Created settings with app configuration";
    }

    async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("settings");
        await db.database.ref(path).remove();
        return "Removed settings";
    }
}
