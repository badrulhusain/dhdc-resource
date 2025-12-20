import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
    format: string;
}

export const uploadToCloudinary = (
    fileBuffer: Buffer,
    folderPath: string,
    resourceType: "image" | "video" | "raw" = "raw"
): Promise<CloudinaryUploadResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderPath,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error("Cloudinary upload failed"));
                resolve({
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    format: result.format,
                });
            }
        );

        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

export default cloudinary;
