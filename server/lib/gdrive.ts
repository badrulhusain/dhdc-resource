import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

async function getDriveService() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!email || !privateKey) {
        throw new Error("Google Service Account credentials are not set");
    }

    const auth = new google.auth.JWT(email, undefined, privateKey, SCOPES);
    return google.drive({ version: "v3", auth });
}

export interface GDriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
}

export async function getFolderFiles(folderId: string): Promise<GDriveFile[]> {
    try {
        const drive = await getDriveService();
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: "files(id, name, mimeType, webViewLink)",
        });

        return (response.data.files as GDriveFile[]) || [];
    } catch (error) {
        console.error("Error fetching files from Google Drive:", error);
        throw error;
    }
}
