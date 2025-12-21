import { IRunnableScript, IMigrationInfo } from "@migration-script-runner/core";
import { IFirebaseDB } from "../../../src";
import { FirebaseHandler } from "../../../src/service/FirebaseHandler";

export default class CreateUsers implements IRunnableScript<IFirebaseDB> {
    async up(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("users");
        const usersRef = db.database.ref(path);

        await usersRef.set({
            user1: { name: "Alice", email: "alice@example.com", role: "admin" },
            user2: { name: "Bob", email: "bob@example.com", role: "user" },
            user3: { name: "Charlie", email: "charlie@example.com", role: "user" }
        });

        return "Created users table with 3 initial users";
    }

    async down(db: IFirebaseDB, info: IMigrationInfo, handler: FirebaseHandler): Promise<string> {
        const path = handler.cfg.buildPath("users");
        await db.database.ref(path).remove();
        return "Removed users table";
    }
}
