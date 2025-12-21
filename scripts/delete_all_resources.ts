import "dotenv/config";
import mongoose from "mongoose";
import { Resource } from "../server/models/Resource";
import { connectDB } from "../server/db";

async function deleteAllResources() {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Deleting all resources...");
        const result = await Resource.deleteMany({});

        console.log(`Successfully deleted ${result.deletedCount} resources.`);
        process.exit(0);
    } catch (error) {
        console.error("Error deleting resources:", error);
        process.exit(1);
    }
}

deleteAllResources();
