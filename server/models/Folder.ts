import mongoose, { Schema, Document } from "mongoose";

export interface IFolder extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    class: string;
    parentFolder?: mongoose.Types.ObjectId;
    path: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const folderSchema = new Schema<IFolder>({
    name: { type: String, required: true },
    class: {
        type: String,
        required: true,
        enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "GENERAL"]
    },
    parentFolder: {
        type: Schema.Types.ObjectId,
        ref: "Folder",
        default: null,
    },
    path: [{ type: Schema.Types.ObjectId, ref: "Folder" }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
});

folderSchema.index({ class: 1, parentFolder: 1 });

export const Folder =
    mongoose.models.Folder || mongoose.model<IFolder>("Folder", folderSchema);
