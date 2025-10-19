import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import FormData from "form-data";
import fetch from "node-fetch";

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sellfastnow-images";
// Construct R2 endpoint from account ID (standard format)
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
// R2 public URL for serving images
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-bc28db62ca5646428223f0bb8805346b.r2.dev`;

// Cloudflare Images configuration
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN!;
const CLOUDFLARE_IMAGES_DELIVERY_URL = process.env.CLOUDFLARE_IMAGES_DELIVERY_URL!;

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

/**
 * Upload image to Cloudflare R2 and then to Cloudflare Images for optimization
 * @param buffer Image buffer
 * @param filename Original filename
 * @returns Cloudflare Images delivery URL
 */
export async function uploadToCloudflare(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // Generate unique ID for the image
    const imageId = randomUUID();
    const extension = filename.split('.').pop() || 'jpg';
    const key = `${imageId}.${extension}`;

    // Step 1: Upload to R2 for backup/storage
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${extension}`,
    });

    await r2Client.send(putCommand);
    console.log(`✅ Uploaded to R2: ${key}`);

    // Return R2 public URL (Cloudflare Images disabled for now)
    // R2 bucket must have public access enabled for this to work
    const r2PublicUrl = `${R2_PUBLIC_URL}/${key}`;
    console.log(`✅ Image available at: ${r2PublicUrl}`);
    
    return r2PublicUrl;
  } catch (error) {
    console.error('❌ Cloudflare upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple images in parallel to Cloudflare
 * @param files Array of {buffer, filename} objects
 * @returns Array of Cloudflare Images delivery URLs
 */
export async function uploadMultipleToCloudflare(
  files: Array<{ buffer: Buffer; filename: string }>
): Promise<string[]> {
  console.log(`📤 Starting parallel upload of ${files.length} images to Cloudflare...`);
  
  // Upload all images in parallel (no delays!)
  const uploadPromises = files.map(file => 
    uploadToCloudflare(file.buffer, file.filename)
  );

  const results = await Promise.all(uploadPromises);
  
  console.log(`✅ Successfully uploaded ${results.length} images to Cloudflare`);
  return results;
}
