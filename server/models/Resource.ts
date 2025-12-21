import mongoose, { Schema, Document } from "mongoose";

export interface IResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  link: string;
  class: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "GENERAL";
  category: string;
  type: "PDF" | "AUDIO" | "VIDEO" | string;
  folderId?: mongoose.Types.ObjectId;
  driveFolderId?: string;
  embedType?: "youtube" | "audio" | "iframe" | "external";
  embedUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  description: { type: String },
  link: { type: String, required: true },
  class: {
    type: String,
    required: true,
    enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"]
  },
  category: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["PDF", "AUDIO", "VIDEO", "E-Book", "Audiobook", "E-Library", "GDRIVE_FOLDER", "Other Resources"]
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: "Folder",
    required: false, // Optional for legacy support, but UI will enforce it for new uploads
  },
  driveFolderId: { type: String },
  embedType: {
    type: String,
    enum: ["youtube", "audio", "iframe", "external"],
    default: "external",
  },
  embedUrl: { type: String },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

resourceSchema.index({ class: 1, category: 1, type: 1 });
resourceSchema.index({ title: "text" });

export const Resource =
  mongoose.models.Resource ||
  mongoose.model<IResource>("Resource", resourceSchema);
