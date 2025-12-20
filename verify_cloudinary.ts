import 'dotenv/config';
import { uploadToCloudinary } from './server/lib/cloudinary';

async function test() {
    try {
        console.log("Starting Cloudinary Upload Test...");
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error("Missing CLOUDINARY_CLOUD_NAME in env");
        }

        const buffer = Buffer.from("Date: " + new Date().toISOString());
        console.log("Uploading test buffer...");

        // Using a safe test folder
        const result = await uploadToCloudinary(buffer, "dhdc_test_verification", "raw");

        console.log("Upload successful!");
        console.log("Public ID:", result.public_id);
        console.log("URL:", result.secure_url);
        console.log("Format:", result.format); // Should be undefined or string, but not crash

    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
}

test();
