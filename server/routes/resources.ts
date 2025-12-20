import { RequestHandler } from "express";
import { Resource } from "../models/Resource";
import { connectDB } from "../db";
import mongoose from "mongoose";

export const handleGetResources: RequestHandler = async (req, res) => {
  try {
    await connectDB();

    const { class: classFilter, category, type, search, folderId } = req.query; // Added folderId

    console.log("GET /api/resources query:", { folderId, classFilter, category, type }); // DEBUG

    let query: any = {};

    if (folderId) {
      query.folderId = folderId;
    }

    if (classFilter && classFilter !== "") {
      query.class = classFilter;
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

    res.json(resources);
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
