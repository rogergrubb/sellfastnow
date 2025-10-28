import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";
import { upload } from "../cloudinary";

const router = Router();

/**
 * POST /api/images/upload
 * Upload single image to Cloudflare R2
 */
router.post("/upload", isAuthenticated, upload.single("image"), async (req: any, res) => {
  try {
    console.log('📤 Image upload request received from user:', req.auth?.userId);
    
    if (!req.file) {
      console.error('❌ No image file provided in request');
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to Cloudflare R2 + Images
    const { uploadToCloudflare } = await import('../cloudflareStorage');
    const imageUrl = await uploadToCloudflare(req.file.buffer, req.file.originalname);
    
    console.log('✅ Image uploaded successfully to Cloudflare:', imageUrl);
    
    res.json({ 
      imageUrl,
      publicId: imageUrl.split('/').pop()?.split('?')[0] || '',
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

/**
 * POST /api/images/upload-multiple
 * Upload multiple images to Cloudflare (PARALLEL - NO DELAYS!)
 */
router.post("/upload-multiple", isAuthenticated, upload.array("images", 200), async (req: any, res) => {
  try {
    if (!req.files || (req.files as any[]).length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }

    console.log(`📤 Uploading ${(req.files as any[]).length} images to Cloudflare in parallel...`);
    
    // Upload all images in parallel to Cloudflare
    const { uploadMultipleToCloudflare } = await import('../cloudflareStorage');
    const files = (req.files as any[]).map((file: any) => ({
      buffer: file.buffer,
      filename: file.originalname,
    }));
    
    const imageUrls = await uploadMultipleToCloudflare(files);
    
    const images = imageUrls.map((imageUrl) => ({
      imageUrl,
      publicId: imageUrl.split('/').pop()?.split('?')[0] || '',
    }));

    console.log(`✅ Successfully uploaded ${images.length} images to Cloudflare`);
    res.json({ images });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

/**
 * POST /api/upload-session/create
 * Create a new upload session (QR Code phone-to-desktop uploads)
 */
router.post("/upload-session/create", isAuthenticated, async (req: any, res) => {
  try {
    const { nanoid } = await import('nanoid');
    const userId = req.auth.userId;
    const sessionId = nanoid(12); // Generate unique 12-char ID
    
    // Sessions expire in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    const session = await storage.createUploadSession({
      id: sessionId,
      userId,
      images: [],
      expiresAt,
    });
    
    console.log(`✅ Upload session created: ${sessionId} for user ${userId}`);
    res.json(session);
  } catch (error: any) {
    console.error("Error creating upload session:", error);
    res.status(500).json({ message: "Failed to create upload session" });
  }
});

/**
 * POST /api/upload-session/:id/upload
 * Upload images to a session (called from mobile)
 */
router.post("/upload-session/:id/upload", upload.array("images", 100), async (req: any, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📤 Mobile upload to session ${id}`);
    
    const session = await storage.getUploadSession(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found or expired" });
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await storage.deleteUploadSession(id);
      return res.status(410).json({ message: "Session expired" });
    }
    
    if (!req.files || (req.files as any[]).length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }
    
    // Upload images to Cloudflare
    const { uploadMultipleToCloudflare } = await import('../cloudflareStorage');
    const files = (req.files as any[]).map((file: any) => ({
      buffer: file.buffer,
      filename: file.originalname,
    }));
    
    const imageUrls = await uploadMultipleToCloudflare(files);
    
    // Add images to session
    const updated = await storage.addImagesToSession(id, imageUrls);
    
    console.log(`✅ Added ${imageUrls.length} images to session ${id}`);
    res.json({ 
      success: true, 
      imageCount: updated.images.length,
      newImages: imageUrls,
    });
  } catch (error: any) {
    console.error("Error uploading to session:", error);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

/**
 * GET /api/upload-session/:id/images
 * Get images from a session (polling endpoint for desktop)
 */
router.get("/upload-session/:id/images", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    
    const session = await storage.getUploadSession(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Verify the session belongs to this user
    if (session.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      await storage.deleteUploadSession(id);
      return res.status(410).json({ message: "Session expired" });
    }
    
    res.json({ images: session.images });
  } catch (error: any) {
    console.error("Error fetching session images:", error);
    res.status(500).json({ message: "Failed to fetch images" });
  }
});

/**
 * DELETE /api/upload-session/:id
 * Delete/cleanup a session
 */
router.delete("/upload-session/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    
    const session = await storage.getUploadSession(id);
    if (session && session.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await storage.deleteUploadSession(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Failed to delete session" });
  }
});

export default router;

