import { connectDB } from "./server/db.js";
import { Resource } from "./server/models/Resource.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  await connectDB();
  try {
    const resource = new Resource({
      title: "Test Folder",
      description: "Test",
      link: "https://drive.google.com/drive/folders/123",
      class: "GENERAL",
      category: "Academic",
      type: "GDRIVE_FOLDER",
      driveFolderId: "123",
      createdBy: new mongoose.Types.ObjectId(), // Fake user ID
    });
    await resource.save();
    console.log("Success!");
    await Resource.deleteOne({ _id: resource._id });
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

test();
