import { RequestHandler } from "express";
import { Resource } from "../models/Resource.js";
import { connectDB } from "../db.js";
import mongoose from "mongoose";
import { 
  listFolderContents, 
  DriveItem, 
  extractFolderId, 
  extractFileId, 
  mapMimeType 
} from "../lib/drive.js"; 

export const handleGetResources: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const { class: classFilter, category, type, search, folderId } = req.query;

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

    const processedResources = await Promise.all(
      resources.map(async (resource: any) => {
        if (resource.type === "GDRIVE_FOLDER" && resource.driveFolderId) {
          try {
            const rootItem = await listFolderContents(resource.driveFolderId);
            if (!rootItem) {
              return [{
                _error: "inaccessible",
                _id: `error-${resource._id}`,
                title: resource.title,
                driveFolderId: resource.driveFolderId,
                class: resource.class,
                category: resource.category,
              }];
            }

            const flattenedFiles: any[] = [];

            // Fetch shadow resources once so Drive files with DB overrides are deduplicated
            const allShadows = await (Resource as any).find({ driveFileId: { $exists: true } });
            const shadowMap = new Map();
            allShadows.forEach((r: any) => shadowMap.set(r.driveFileId, r));

            const flatten = (item: DriveItem) => {
                if (item.id && shadowMap.has(item.id)) {
                  const shadow = shadowMap.get(item.id);
                  if (shadow.isHidden) return;
                  return; // shadow DB record will appear via main query
                }

                const appType = mapMimeType(item.mimeType);

                // Include all non-folder items (OTHERS = Google Docs/Sheets/Slides/etc.)
                if (appType !== "GDRIVE_FOLDER") {
                    flattenedFiles.push({
                      _id: `gdrive-${resource._id}-${item.id}`,
                      title: item.name.replace(/\.[^/.]+$/, ""), // Remove any extension
                      description: `Part of ${resource.title}`,
                      link: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
                      class: resource.class,
                      category: resource.category,
                      type: appType === "OTHERS" ? "GDRIVE_FILE" : appType, // treat unknown as GDRIVE_FILE for the viewer
                      mimeType: item.mimeType,
                      thumbnailLink: item.thumbnailLink,
                      createdBy: resource.createdBy,
                      createdAt: resource.createdAt,
                      driveFileId: item.id,
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

    // Separate error markers from real resources BEFORE pagination
    // so errors never displace real resources off a page
    const driveErrors = allResources.filter((r: any) => r._error === "inaccessible");
    const realResources = allResources.filter((r: any) => !r._error);

    const totalResources = realResources.length;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const totalPages = Math.ceil(totalResources / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Deduplicate drive errors by driveFolderId so the same inaccessible folder
    // doesn't spam the UI when it appears multiple times in the DB
    const seenFolderIds = new Set<string>();
    const uniqueErrors = driveErrors.filter((e: any) => {
      if (seenFolderIds.has(e.driveFolderId)) return false;
      seenFolderIds.add(e.driveFolderId);
      return true;
    });

    res.json({
      resources: realResources.slice(startIndex, endIndex),
      errors: uniqueErrors,
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

    if (!title || !link || !classValue || !category || !type) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Automatic detection of GDrive link type and extraction of IDs
    let finalDriveFolderId = driveFolderId;
    let finalDriveFileId = undefined;
    let finalType = type;

    if (link && (link.includes("drive.google.com") || link.includes("goo.gl/drive"))) {
        const folderIdMatch = extractFolderId(link);
        const fileIdMatch = extractFileId(link);

        if (folderIdMatch) {
            finalDriveFolderId = folderIdMatch;
            finalType = "GDRIVE_FOLDER";
        } else if (fileIdMatch) {
            finalDriveFileId = fileIdMatch;
            // If the user selected GDRIVE_FOLDER but gave a file link, fix it to GDRIVE_FILE
            // However, if they selected PDF/AUDIO/VIDEO, keep that type but store the fileId
            if (finalType === "GDRIVE_FOLDER") {
                finalType = "GDRIVE_FILE";
            }
        }
    }

    const resource = new Resource({
      title,
      description,
      link,
      class: classValue,
      category,
      type: finalType,
      folderId: folderId || undefined,
      driveFolderId: finalDriveFolderId || undefined,
      driveFileId: finalDriveFileId || undefined,
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

    if (id.startsWith("gdrive-")) {
      const driveFileId = id.replace("gdrive-", "");

      if (!mongoose.Types.ObjectId.isValid(user.userId)) {
        res.status(500).json({ error: "Invalid admin user ID" });
        return;
      }

      if (!link || !classValue || !category || !type) {
        res.status(400).json({ error: "Missing required fields (link, class, category, type)" });
        return;
      }

      const resource = new Resource({
        title,
        description,
        link,
        class: classValue,
        category,
        type: "GDRIVE_FILE",
        driveFileId,
        createdBy: new mongoose.Types.ObjectId(user.userId),
      });

      try {
        await resource.save();
        return res.json(resource);
      } catch (err) {
        console.error("Failed to save shadow resource:", err);
        res.status(500).json({ error: "Failed to create shadow resource" });
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
