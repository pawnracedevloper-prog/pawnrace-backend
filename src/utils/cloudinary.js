import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  if (!filePath) return null;

  // Ensure path uses forward slashes (Windows fix)
  const normalizedPath = path.resolve(filePath).replace(/\\/g, "/");

  try {
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });
    console.log("✅ Image uploaded successfully:", response.secure_url);
    return response.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    throw error;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete temp file:", err.message);
        else console.log("🗑️ Temp file deleted:", filePath);
      });
    }
  }
};
console.log("Cloudinary key:", process.env.CLOUDINARY_API_KEY);
export default uploadOnCloudinary;
