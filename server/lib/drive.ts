import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

// Attempt to load .env from project root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), ".env") });


const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

/**
 * Initialize Google Drive Client
 * Uses Service Account authentication with server-side only credentials
 */
function getDriveClient() {
    // Check both possible variable names to be safe
    const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Handle newlines in private key which might be escaped in some env vars
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    // Debug log to help diagnose (safe to log email, NOT key)
    if (!email) console.error("Drive Client Error: Email is missing from env");
    if (!rawKey) console.error("Drive Client Error: Private Key is missing from env");

    const key = rawKey?.replace(/\\n/g, "\n");

    if (!email || !key) {
        throw new Error("Missing Google Service Account credentials. Checked GOOGLE_CLIENT_EMAIL/GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.");
    }

    const auth = new google.auth.JWT(email, undefined, key, SCOPES);
    return google.drive({ version: "v3", auth });
}

/**
 * Extract Folder ID from Google Drive Link
 * Validates URL format and extracts ID via regex
 */
export function extractFolderId(url: string): string | null {
    if (!url) return null;

    // Support common Drive folder URL formats
    const patterns = [
        /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

export interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    children?: DriveItem[];
}

/**
 * Recursive Folder Traversal
 * Lists files and subfolders, returning a tree-structured JSON
 */
export async function listFolderContents(folderId: string): Promise<DriveItem | null> {
    const drive = getDriveClient();

    // 1. Get the root folder details
    const folderRes = await drive.files.get({
        fileId: folderId,
        fields: "id, name, mimeType, webViewLink",
    });

    if (!folderRes.data.id || !folderRes.data.name) {
        return null;
    }

    const root: DriveItem = {
        id: folderRes.data.id,
        name: folderRes.data.name,
        mimeType: folderRes.data.mimeType || "application/vnd.google-apps.folder",
        children: [],
    };

    // 2. Recursive function to fetch children
    async function fetchChildren(parentId: string, visited: Set<string>): Promise<DriveItem[]> {
        // Prevent infinite loops (though Drive is usually DAG, shortcuts can create cycles)
        if (visited.has(parentId)) return [];
        visited.add(parentId);

        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed = false`,
            fields: "files(id, name, mimeType, webViewLink)",
            pageSize: 1000,
        });

        const files = res.data.files || [];
        const children: DriveItem[] = [];

        for (const file of files) {
            if (!file.id || !file.name) continue;

            const item: DriveItem = {
                id: file.id,
                name: file.name,
                mimeType: file.mimeType || "application/octet-stream",
                webViewLink: file.webViewLink || "",
            };

            // Recursive call for subfolders
            if (file.mimeType === "application/vnd.google-apps.folder") {
                // Clone visited set for path-based cycle detection (or pass same set for global uniqueness)
                // For tree structure, we generally want to avoid processing the same folder twice in a branch.
                item.children = await fetchChildren(file.id, new Set(visited));
            }

            children.push(item);
        }
        return children;
    }

    root.children = await fetchChildren(folderId, new Set());
    return root;
}
