import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!;
await mongoose.connect(uri);
console.log("Connected");

const db = mongoose.connection.db!;
try {
  await db.collection("users").dropIndex("username_1");
  console.log("Dropped stale index: username_1");
} catch (e: any) {
  console.log("Index not found or already gone:", e.message);
}

await mongoose.disconnect();
process.exit(0);
