import { RequestHandler } from "express";
import { Resource } from "../models/Resource.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";
import { getFolderFiles } from "../lib/gdrive.js";
import { listFolderContents, DriveItem } from "../lib/drive.js"; // Import new recursive lib
import studentDataRaw from "../data.json" with { type: "json" };
import { Folder } from "../models/Folder.js";

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
      query.title = { $regex: search as string, $options: "i" };
    }

    // Exclude hidden resources (Soft Deleted)
    query.isHidden = { $ne: true };

    const resources = await (Resource as any).find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Handle Google Drive Folders: Recursively fetch and flatten
    const processedResources = await Promise.all(
      resources.map(async (resource: any) => {
        // Handle "Shadow Resources" (DB records that override Drive files)
        // If a resource has a driveFileId, it is a shadow resource.
        // We will collect them separately to override the Drive items later.
        // Actually, the main 'resources' query already returns them.
        // We just need to make sure we don't return them TWICE (once as DB resource, once as Drive item).
        // AND we need to use them to override the Drive items.

        // Strategy:
        // 1. Fetch all Shadow Resources for the current query context (this is already done in `resources` const).
        // 2. Build a map of driveFileId -> Shadow Resource.
        // 3. When traversing Drive folders, check against this map.

        if (resource.type === "GDRIVE_FOLDER" && resource.driveFolderId) {
          // Visibility check
          const isVisible =
            user?.role === "admin" ||
            resource.class === "GENERAL" ||
            resource.class === studentClass;

          if (!isVisible) return [];

          try {
            const rootItem = await listFolderContents(resource.driveFolderId);
            if (!rootItem) {
              console.warn(`Drive folder ${resource.driveFolderId} (${resource.title}) is inaccessible. Skipping.`);
              return [];
            }

            const flattenedFiles: any[] = [];

            // Build map of shadow resources from the MAIN resources list that match this folder's context?
            // Actually, we should query for shadow resources globally or filter from the fetched `resources`.
            // But `resources` only contains what matched the search/filter query.
            // Shadow resources MUST share the same class/category as their parent folder usually, OR we just query them.
            // Let's assume shadow resources are in `resources`.
            // Problem: If the user filters by "Title A", and the Drive file has "Title B" (original),
            // but we renamed it to "Title A" (shadow), then `resources` will contain the shadow.
            // If the user searches "Title B", `resources` won't contain the shadow, but we'll fetch the Drive file "Title B".
            // We should hide "Title B" if it has a shadow.
            // So we need to know existing shadows to HIDE the original.

            // To do this correctly, we need to fetch ALL shadow resources potentially related to these files.
            // That might be expensive.
            // Alternative: Just fetch all resources with `driveFileId` property set?
            const allShadows = await (Resource as any).find({ driveFileId: { $exists: true } });
            const shadowMap = new Map();
            allShadows.forEach((r: any) => shadowMap.set(r.driveFileId, r));

            // Recursive helper to flatten the tree
            const flatten = (item: DriveItem) => {
              if (item.mimeType === "application/pdf" && item.id) {
                // Check for shadow resource
                if (shadowMap.has(item.id)) {
                  const shadow = shadowMap.get(item.id);
                  // If hidden, skip entirely
                  if (shadow.isHidden) {
                    return;
                  }
                  // If not hidden, the Shadow Resource ITSELF should be returned by the main query 
                  // IF it matches the filters. 
                  // But 'resources' already contains matching DB records.
                  // So if we are here inside a GDRIVE_FOLDER resource, we are generating EXTRA items.
                  // We should NOT generate an item if a shadow exists, 
                  // because the shadow DB record will be returned independently (or filtered out if it doesn't match).
                  return;
                }

                // No shadow, return standard Drive item
                flattenedFiles.push({
                  _id: `gdrive-${item.id}`,
                  title: item.name.replace(/\.pdf$/i, ""),
                  description: `Part of ${resource.title}`,
                  link: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
                  class: resource.class,
                  category: resource.category,
                  type: "GDRIVE_FILE",
                  mimeType: item.mimeType,
                  createdBy: resource.createdBy,
                  createdAt: resource.createdAt,
                  driveFileId: item.id, // Ensure we pass this so UI knows it's a Drive file
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

    // Check if we are updating a virtual Drive file
    if (id.startsWith("gdrive-")) {
      console.log("Updating virtual Drive file:", id);
      const driveFileId = id.replace("gdrive-", "");

      // Validate user ID
      if (!mongoose.Types.ObjectId.isValid(user.userId)) {
        console.error("Invalid user ID for admin:", user.userId);
        res.status(500).json({ error: "Invalid admin user ID" });
        return;
      }

      // Ensure required fields are present. 
      // If the frontend only sends changed fields (e.g. title), we need the rest.
      // But we can't get them from DB because it doesn't exist yet!
      // The frontend MUST send the full object state or we must validly reconstruct it.
      // If 'link' is missing, we can reconstruct it from driveFileId, but 'class'/'category' are critical.

      if (!link || !classValue || !category || !type) {
        console.error("Missing required fields for shadow resource creation:", { link, classValue, category, type });
        res.status(400).json({ error: "Missing required fields (link, class, category, type) for creating shadow resource" });
        return;
      }

      // Create a new Shadow Resource
      const resource = new Resource({
        title, // New title
        description,
        link,
        class: classValue,
        category,
        type: "GDRIVE_FILE", // Keep it as file
        driveFileId,
        createdBy: new mongoose.Types.ObjectId(user.userId),
        // We inherit other props ??
      });

      try {
        await resource.save();
        console.log("Shadow resource created:", resource._id);
        return res.json(resource);
      } catch (err) {
        console.error("Failed to save shadow resource:", err);
        res.status(500).json({ error: "Failed to create shadow resource. Check server logs." });
        return;
      }
    }

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

    // Handle Virtual Drive File Delete
    if (id.startsWith("gdrive-")) {
      const driveFileId = id.replace("gdrive-", "");

      // Create a Shadow Resource marked as Hidden
      const resource = new Resource({
        title: "Hidden Resource", // Placeholder
        link: "https://drive.google.com", // Placeholder
        class: "GENERAL", // Placeholder
        category: "Hidden",
        type: "GDRIVE_FILE",
        driveFileId,
        isHidden: true,
        createdBy: new mongoose.Types.ObjectId(user.userId),
      });

      await resource.save();
      return res.json({ message: "Resource hidden" });
    }

    const resource = await (Resource as any).findById(id);
    if (!resource) {
      res.status(404).json({ error: "Resource not found" });
      return;
    }

    // If it's a Shadow Resource, we just Soft Delete (hide) it?
    // Or if the user deletes a Shadow Resource that was an EDIT, do they want to revert to original?
    // Usually "Delete" means "Remove from view". 
    // If it's a Shadow Resource (Edit), deleting it should probably HIDE it, NOT revert it.
    // So we update isHidden: true.

    if (resource.driveFileId) {
      resource.isHidden = true;
      await resource.save();
      return res.json({ message: "Resource hidden" });
    }

    // Standard Resource - Hard Delete
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
