import * as admin from "firebase-admin";
import _ from "lodash";
import {FirebaseConfig} from "../model";

export class DBConnector {

    public static async connect(cfg:FirebaseConfig): Promise<admin.database.Database> {
        console.log(`Init DB connection: databaseUrl = ${cfg.databaseUrl}; applicationCredentials = ${cfg.applicationCredentials}`)

        const filePath = cfg.applicationCredentials
        if(!filePath) throw new Error("Application credentials not found")

        const serviceAccount = await import(filePath)
        const name = `${Date.now()}-${_.random(10)}`
        const options = {
            credential: admin.credential.cert(serviceAccount),
        } as admin.AppOptions

        const app = admin.initializeApp(options, name)

        return app.database(cfg.databaseUrl)
    }
}