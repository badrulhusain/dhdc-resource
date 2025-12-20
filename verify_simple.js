require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error("Error: .env not loaded or missing CLOUDINARY_CLOUD_NAME");
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary Configured.");

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "dhdc_test_verification" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        const stream = new Readable();
        stream.push(fileBuffer);
        stream.push(null);
        stream.pipe(uploadStream);
    });
};

async function run() {
    try {
        console.log("Uploading...");
        const res = await uploadToCloudinary(Buffer.from("test content " + Date.now()));
        console.log("Upload finished.");
        console.log("Keys in response:", Object.keys(res));
        console.log("Format value:", res.format);
        if (res.format === undefined) {
            console.log("VERIFIED: 'format' is undefined for raw files.");
        } else {
            console.log("INFO: 'format' is present properly.");
        }
    } catch (e) {
        console.error("Upload error:", e);
    }
}
run();
