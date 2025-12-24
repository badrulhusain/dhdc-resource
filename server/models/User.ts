import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export { User };
