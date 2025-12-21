import { IRunnableScript, IMigrationInfo } from "@migration-script-runner/core";
import { IFirebaseDB } from "../../../src";
import { FirebaseHandler } from "../../../src/service/FirebaseHandler";

export default class CreateComments implements IRunnableScript<IFirebaseDB> {
    async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("comments");
        const commentsRef = db.database.ref(path);

        await commentsRef.set({
            comment1: { postId: "post1", author: "user2", text: "Great post!" },
            comment2: { postId: "post1", author: "user3", text: "Thanks for sharing" },
            comment3: { postId: "post2", author: "user1", text: "Interesting perspective" }
        });

        return "Created comments table with 3 initial comments";
    }

    async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("comments");
        await db.database.ref(path).remove();
        return "Removed comments table";
    }
}
