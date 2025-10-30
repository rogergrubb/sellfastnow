import sharp from "sharp";
import { storage } from "../storage";

/**
 * Service for rotating images
 */

export interface RotateImageOptions {
  imageUrl: string;
  degrees: 90 | 180 | 270;
}

/**
 * Rotate an image by specified degrees
 * @param imageUrl - URL of the image to rotate
 * @param degrees - Rotation angle (90, 180, or 270)
 * @returns New image URL
 */
export async function rotateImage(
  imageUrl: string,
  degrees: 90 | 180 | 270
): Promise<string> {
  try {
    // For now, we'll store rotation metadata
    // In production, you would:
    // 1. Download image from storage
    // 2. Rotate using sharp
    // 3. Upload rotated image back to storage
    // 4. Return new URL
    
    // Since we're using Cloudflare R2, we'll implement client-side rotation
    // and store the rotation preference in the database
    
    return imageUrl; // Return original URL for now
  } catch (error) {
    console.error("Error rotating image:", error);
    throw new Error("Failed to rotate image");
  }
}

/**
 * Get rotation angle for an image from database
 */
export async function getImageRotation(imageUrl: string): Promise<number> {
  // This would query the database for stored rotation preference
  return 0;
}

/**
 * Store rotation angle for an image
 */
export async function setImageRotation(
  imageUrl: string,
  degrees: number
): Promise<void> {
  // This would store the rotation preference in database
  // For now, we'll handle rotation client-side with CSS transforms
}

