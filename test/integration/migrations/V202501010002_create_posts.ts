import { IRunnableScript, IMigrationInfo } from "@migration-script-runner/core";
import { IFirebaseDB } from "../../../src";
import { FirebaseHandler } from "../../../src/service/FirebaseHandler";

export default class CreatePosts implements IRunnableScript<IFirebaseDB> {
    async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("posts");
        const postsRef = db.database.ref(path);

        await postsRef.set({
            post1: { title: "First Post", author: "user1", content: "Hello World!" },
            post2: { title: "Second Post", author: "user2", content: "Firebase is great" }
        });

        return "Created posts table with 2 initial posts";
    }

    async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("posts");
        await db.database.ref(path).remove();
        return "Removed posts table";
    }
}
