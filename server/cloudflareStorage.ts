import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sellfastnow-images";
const R2_ENDPOINT = process.env.R2_ENDPOINT!;

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

    // Step 2: Upload to Cloudflare Images for optimization and delivery
    const formData = new FormData();
    const blob = new Blob([buffer], { type: `image/${extension}` });
    formData.append('file', blob, filename);
    formData.append('id', imageId);
    formData.append('requireSignedURLs', 'false');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare Images upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare Images API error: ${JSON.stringify(result.errors)}`);
    }

    // Return the optimized image delivery URL
    const deliveryUrl = `${CLOUDFLARE_IMAGES_DELIVERY_URL}/${imageId}/public`;
    console.log(`✅ Uploaded to Cloudflare Images: ${deliveryUrl}`);
    
    return deliveryUrl;
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
