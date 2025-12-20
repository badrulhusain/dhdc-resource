import { RequestHandler } from "express";
import { Resource } from "../models/Resource";
import { connectDB } from "../db";
import mongoose from "mongoose";
import { getFolderFiles } from "../lib/gdrive";
import studentDataRaw from "../data.json";
import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary";
import { Folder } from "../models/Folder";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const handleGetResources: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const { class: classFilter, category, type, search, folderId } = req.query; // Added folderId

    console.log("GET /api/resources query:", { folderId, classFilter, category, type }); // DEBUG

    const user = (req as any).user;
    let studentClass = "";
    if (user?.role === "student" && user.userId.startsWith("student-")) {
      const adNo = Number(user.userId.split("-")[1]);
      const data = studentDataRaw as any;
      for (const [className, students] of Object.entries(data.students)) {
        if ((students as any[]).some((s) => s.adNo === adNo)) {
          studentClass = className;
          break;
        }
      }
    }

    let query: any = {};

    if (folderId) {
      query.folderId = folderId;
    }

    if (classFilter && classFilter !== "") {
      query.class = { $in: [classFilter, "GENERAL"] };
    }

    if (category && category !== "" && category !== "all") {
      query.category = category;
    }

    if (type && type !== "") {
      query.type = type;
    }

    if (search && search !== "") {
      query.$text = { $search: search as string };
    }

    const resources = await (Resource as any).find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Handle Google Drive Folders
    const processedResources = await Promise.all(
      resources.map(async (resource: any) => {
        if (resource.type === "GDRIVE_FOLDER" && resource.driveFolderId) {
          // Visibility check for students
          const isVisible =
            user?.role === "admin" ||
            resource.class === "GENERAL" ||
            resource.class === studentClass;

          if (!isVisible) return [];

          try {
            const files = await getFolderFiles(resource.driveFolderId);
            return files.map((file) => ({
              _id: `gdrive-${file.id}`,
              title: file.name,
              description: `Part of ${resource.title}`,
              link: file.webViewLink,
              class: resource.class,
              category: resource.category,
              type: "GDRIVE_FILE", // Use a specific type for files from drive
              mimeType: file.mimeType,
              createdBy: resource.createdBy,
              createdAt: resource.createdAt,
            }));
          } catch (error) {
            console.error(`Failed to fetch files for folder ${resource.driveFolderId}:`, error);
            return []; // Fail gracefully
          }
        }
        return [resource];
      })
    );

    res.json(processedResources.flat());
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

export const handleCreateResource: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await connectDB();

    const {
      title,
      description,
      link,
      class: classValue,
      category,
      type,
      folderId, // Added folderId
      driveFolderId, // Added driveFolderId
      embedType, // Added embedType
      embedUrl, // Added embedUrl
    } = req.body;

    console.log("POST /api/resources body:", { title, folderId, classValue }); // DEBUG

    if (!title || !link || !classValue || !category || !type) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const resource = new Resource({
      title,
      description,
      link,
      class: classValue,
      category,
      type,
      folderId: folderId || undefined,
      driveFolderId: driveFolderId || undefined,
      embedType,
      embedUrl,
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    await resource.save();
    await resource.populate("createdBy", "name email");

    res.status(201).json(resource);
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
};

export const handleUploadResource: RequestHandler = async (req: any, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    await connectDB();

    const { title, description, category, type, folderId } = req.body;

    if (!title || !category || !type || !folderId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const folder = await (Folder as any).findById(folderId);
    if (!folder) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }

    // Determine target Cloudinary resource type
    let cloudinaryResourceType: "image" | "video" | "raw" = "raw";
    if (type === "VIDEO") cloudinaryResourceType = "video";
    // For PDF and AUDIO, Cloudinary often prefers 'raw' or 'auto' (image/video covers some), but 'raw' is safest for PDF.
    // Audio can be 'video' in Cloudinary for transcoding.
    if (type === "AUDIO") cloudinaryResourceType = "video";

    const result = await uploadToCloudinary(
      req.file.buffer,
      folder.cloudinaryPath,
      cloudinaryResourceType
    );

    const resource = new Resource({
      title,
      description,
      link: result.secure_url,
      class: folder.class,
      category,
      type,
      folderId,
      cloudinaryPublicId: result.public_id,
      secureUrl: result.secure_url,
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error("Upload resource error:", error);
    res.status(500).json({ error: "Failed to upload resource" });
  }
};

export const handleUpdateResource: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await connectDB();

    const { id } = req.params;
    const {
      title,
      description,
      link,
      class: classValue,
      category,
      type,
    } = req.body;

    const resource = await (Resource as any).findById(id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (resource.createdBy.toString() !== user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.link = link || resource.link;
    resource.class = classValue || resource.class;
    resource.category = category || resource.category;
    resource.type = type || resource.type;

    await resource.save();
    await resource.populate("createdBy", "name email");

    res.json(resource);
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
};

export const handleDeleteResource: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await connectDB();

    const { id } = req.params;

    const resource = await (Resource as any).findById(id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    if (resource.createdBy.toString() !== user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await (Resource as any).deleteOne({ _id: id });

    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
};
