import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const FOLDER_ID = "1efOrfudFebMLjHVhJa7ofSAZACWhfOLk";

async function debugDrive() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!email || !rawKey) {
        console.error("Missing credentials in .env");
        return;
    }

    const key = rawKey.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT(email, undefined, key, SCOPES);
    const drive = google.drive({ version: "v3", auth });

    console.log(`Checking accessibility for folder ID: ${FOLDER_ID}`);
    console.log(`Using Service Account: ${email}`);

    try {
        const res = await drive.files.get({
            fileId: FOLDER_ID,
            fields: "id, name, mimeType, webViewLink",
        });
        console.log("Success! Folder found:");
        console.log(JSON.stringify(res.data, null, 2));

        const listRes = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed = false`,
            fields: "files(id, name, mimeType)",
        });
        console.log(`Found ${listRes.data.files?.length || 0} items inside the folder.`);
    } catch (error: any) {
        console.error("Error fetching folder:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        console.log("\n--- Troubleshooting Tips ---");
        console.log("1. Ensure the folder ID is correct.");
        console.log("2. Ensure the folder is SHARED with the service account email above.");
        console.log("3. Ensure the folder is not in the Trash.");
    }
}

debugDrive();
