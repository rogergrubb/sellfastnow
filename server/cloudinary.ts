import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Missing Cloudinary environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
}

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sellfast-listings",
    format: async (_req: any, file: any) => {
      // Allow common image formats
      const mimeType = file.mimetype.split("/")[1];
      if (["jpeg", "jpg", "png", "webp", "gif"].includes(mimeType)) {
        return mimeType;
      }
      return "jpg"; // Default to jpg
    },
    public_id: (_req: any, file: any) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const originalName = file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
      return `${timestamp}_${originalName}`;
    },
  } as any,
});

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
