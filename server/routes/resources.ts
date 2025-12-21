import { RequestHandler } from "express";
import { Resource } from "../models/Resource";
import { connectDB } from "../db";
import mongoose from "mongoose";
import { getFolderFiles } from "../lib/gdrive";
import { listFolderContents, DriveItem } from "../lib/drive"; // Import new recursive lib
import studentDataRaw from "../data.json" with { type: "json" };
import { Folder } from "../models/Folder";

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
    // Handle Google Drive Folders: Recursively fetch and flatten
    const processedResources = await Promise.all(
      resources.map(async (resource: any) => {
        if (resource.type === "GDRIVE_FOLDER" && resource.driveFolderId) {
          // Visibility check
          const isVisible =
            user?.role === "admin" ||
            resource.class === "GENERAL" ||
            resource.class === studentClass;

          if (!isVisible) return [];

          try {
            // Using the new recursive listFolderContents
            const rootItem = await listFolderContents(resource.driveFolderId);
            if (!rootItem) {
              console.warn(`Drive folder ${resource.driveFolderId} (${resource.title}) is inaccessible. Skipping.`);
              return [];
            }

            const flattenedFiles: any[] = [];

            // Recursive helper to flatten the tree
            const flatten = (item: DriveItem) => {
              if (item.mimeType === "application/pdf" && item.id) { // Only PDFs for now
                flattenedFiles.push({
                  _id: `gdrive-${item.id}`,
                  title: item.name.replace(/\.pdf$/i, ""),
                  description: `Part of ${resource.title}`, // Trace back?
                  link: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
                  class: resource.class,
                  category: resource.category,
                  type: "GDRIVE_FILE",
                  mimeType: item.mimeType,
                  createdBy: resource.createdBy,
                  createdAt: resource.createdAt,
                });
              }

              if (item.children) {
                item.children.forEach(flatten);
              }
            };

            flatten(rootItem);
            return flattenedFiles;
          } catch (error) {
            console.error(`Failed to fetch/flatten files for folder ${resource.driveFolderId}:`, error);
            // On error, maybe just return the folder resource itself?
            // Or empty? Let's return empty to avoid broken UI.
            return [];
          }
        }
        return [resource];
      })
    );

    const allResources = processedResources.flat();
    const totalResources = allResources.length;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const totalPages = Math.ceil(totalResources / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    res.json({
      resources: allResources.slice(startIndex, endIndex),
      totalResources,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

export const handleGetResourceById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(`GET /api/resources/${id} requested`); // Debug log

    await connectDB();

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid ID format" });
      return;
    }

    const resource = await (Resource as any).findById(id).populate("createdBy", "name email");

    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    // Check visibility if needed (e.g., student class check), but for now we return the resource
    // User can implement stricter granular checks here if required.

    res.json(resource);
  } catch (error) {
    console.error("Get resource by ID error:", error);
    res.status(500).json({ error: "Failed to fetch resource" });
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

    // Extract Google Drive Folder ID if type is GDRIVE_FOLDER
    let finalDriveFolderId = driveFolderId;
    if (type === "GDRIVE_FOLDER" && link) {
      // Regex to extract folder ID from common Drive URLs
      const patterns = [
        /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
      ];
      for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match && match[1]) {
          finalDriveFolderId = match[1];
          break;
        }
      }
    }

    const resource = new Resource({
      title,
      description,
      link,
      class: classValue,
      category,
      type,
      folderId: folderId || undefined,
      driveFolderId: finalDriveFolderId || undefined,
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

// handleUploadResource was removed because Cloudinary is no longer used.

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

    await (Resource as any).deleteOne({ _id: id });

    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
};

export const handleDeleteAllResources: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await connectDB();

    const result = await (Resource as any).deleteMany({});

    res.json({ message: `Successfully deleted ${result.deletedCount} resources.` });
  } catch (error) {
    console.error("Delete all resources error:", error);
    res.status(500).json({ error: "Failed to delete resources" });
  }
};
