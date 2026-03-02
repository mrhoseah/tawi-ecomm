import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const folder = process.env.CLOUDINARY_FOLDER || "tawi-shop";

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export type UploadResult = { secure_url: string; public_id: string } | null;

export async function uploadToCloudinary(
  file: Buffer,
  mimeType: string,
  options?: { folder?: string }
): Promise<UploadResult> {
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  const dataUri = `data:${mimeType};base64,${file.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: options?.folder || folder,
    resource_type: "image",
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
}
