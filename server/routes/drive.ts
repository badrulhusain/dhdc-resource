import { RequestHandler } from "express";
import { z } from "zod";
import { extractFolderId, listFolderContents } from "../lib/drive";

const folderRequestSchema = z.object({
    folderLink: z.string().min(1, "Folder link is required"),
});

export const handleGetDriveFolder: RequestHandler = async (req, res, next) => {
    try {
        const result = folderRequestSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({ error: "Invalid request: folderLink is required" });
            return;
        }

        const { folderLink } = result.data;
        const folderId = extractFolderId(folderLink);

        if (!folderId) {
            res.status(400).json({ error: "Invalid Google Drive folder link. Please ensure it is a valid folder URL." });
            return;
        }

        // List folder contents recursively
        // This might take some time for large folders, but no pagination logic needed for now per requirements.
        const folderTree = await listFolderContents(folderId);

        if (!folderTree) {
            res.status(404).json({ error: "Folder not found or permission denied. Please check the link and permissions." });
            return;
        }

        res.json(folderTree);

    } catch (error: any) {
        console.error("Drive API Error:", error);

        // Handle specific Google Drive API errors
        if (error.code === 404 || (error.errors && error.errors[0]?.reason === 'notFound')) {
            res.status(404).json({ error: "Folder not found. Please check the link." });
            return;
        }

        if (error.code === 403 || (error.errors && error.errors[0]?.reason === 'forbidden')) {
            res.status(403).json({ error: "Permission denied. Please ensure the folder is shared with the Service Account email." });
            return;
        }

        next(error); // Pass to global error handler for 500s
    }
};
