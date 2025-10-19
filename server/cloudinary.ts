import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary with environment variables (kept for backward compatibility)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Use memory storage for multer (files will be in req.file.buffer)
// This allows us to upload to Cloudflare R2 + Images instead of Cloudinary
const storage = multer.memoryStorage();

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Export cloudinary instance for direct use
export { cloudinary };

// Helper function to get optimized image URL
export function getOptimizedImageUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
}): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options?.width || 800,
        height: options?.height,
        crop: options?.crop || "limit",
        quality: options?.quality || "auto",
        fetch_format: "auto",
      },
    ],
  });
}

// Helper function to get thumbnail URL
export function getThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}

// Helper function to delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
}
