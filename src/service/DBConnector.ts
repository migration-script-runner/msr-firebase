import * as admin from "firebase-admin";
import _ from "lodash";
import {FirebaseConfig} from "../model";

export class DBConnector {

    public static async connect(cfg:FirebaseConfig): Promise<admin.database.Database> {
        const filePath = cfg.applicationCredentials
        if(!filePath) throw new TypeError("Application credentials not found in configuration")

        const serviceAccount = await import(filePath)
        const name = `${Date.now()}-${_.random(10)}`
        const options = {
            credential: admin.credential.cert(serviceAccount),
        } as admin.AppOptions

        const app = admin.initializeApp(options, name)

        return app.database(cfg.databaseUrl)
    }
}