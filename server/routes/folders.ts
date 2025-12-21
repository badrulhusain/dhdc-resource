import { RequestHandler, Request } from "express";
import { Folder } from "../models/Folder";
import { connectDB } from "../db";
import mongoose from "mongoose";
import studentDataRaw from "../data.json";

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: "student" | "admin";
        class?: string; // Derived for students
    };
}

export const handleGetFolders: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        await connectDB();
        const { parentId } = req.query;
        const parentFolder = parentId ? String(parentId) : null;
        const user = req.user;

        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const query: any = { parentFolder };

        if (user.role === "student") {
            const data = studentDataRaw as any;
            let studentClass = "";
            if (user.userId.startsWith("student-")) {
                const adNo = Number(user.userId.split("-")[1]);
                for (const [className, students] of Object.entries(data.students)) {
                    if ((students as any[]).find((s) => s.adNo === adNo)) {
                        studentClass = className;
                        break;
                    }
                }
            }

            if (!studentClass) {
                query.class = "GENERAL";
            } else {
                query.class = { $in: [studentClass, "GENERAL"] };
            }
        }

        const folders = await (Folder as any).find(query).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        console.error("Get folders error:", error);
        res.status(500).json({ error: "Failed to fetch folders" });
    }
};

export const handleCreateFolder: RequestHandler = async (req: AuthenticatedRequest, res) => {
    try {
        await connectDB();
        const { name, class: className, parentId } = req.body;
        const user = req.user;

        if (!user || user.role !== "admin") {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        if (!name || !className) {
            res.status(400).json({ error: "Name and class are required" });
            return;
        }

        let path: mongoose.Types.ObjectId[] = [];
        if (parentId) {
            const parent = await (Folder as any).findById(parentId);
            if (!parent) {
                res.status(404).json({ error: "Parent folder not found" });
                return;
            }
            path = [...parent.path, parent._id];
        }

        const validClasses = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"];
        if (!validClasses.includes(className)) {
            res.status(400).json({ error: "Invalid class name" });
            return;
        }

        const folder = new Folder({
            name,
            class: className,
            parentFolder: parentId || null,
            path,
            createdBy: user.userId,
        });

        await folder.save();
        res.status(201).json(folder);
    } catch (error) {
        console.error("Create folder error:", error);
        res.status(500).json({ error: "Failed to create folder" });
    }
};
