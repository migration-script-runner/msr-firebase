import { randomUUID } from "node:crypto";
import { cert, initializeApp, type AppOptions } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import type { Database } from "firebase-admin/database";
import {FirebaseConfig} from "../model";

export class DBConnector {

    public static async connect(cfg:FirebaseConfig): Promise<Database> {
        const filePath = cfg.applicationCredentials
        if(!filePath) throw new TypeError("Application credentials not found in configuration")

        const serviceAccount = await import(filePath)
        const name = randomUUID()
        const options: AppOptions = {
            credential: cert(serviceAccount),
            databaseURL: cfg.databaseUrl,
        }

        const app = initializeApp(options, name)

        return getDatabase(app)
    }
}
