// Comprehensive API routes for SellFast.Now marketplace
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { setupAuth, isAuthenticated } from "./clerkAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { upload } from "./cloudinary";
import {
  insertListingSchema,
  insertMessageSchema,
  insertFavoriteSchema,
  insertReviewSchema,
  insertReviewVoteSchema,
  insertCancellationCommentSchema,
  insertCancellationCommentVoteSchema,
  transactionEvents,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // ======================
  // Authentication Routes
  // ======================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get AI usage info for current user
  app.get('/api/ai/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const usageInfo = await storage.getAIUsageInfo(userId);
      res.json(usageInfo);
    } catch (error) {
      console.error("Error fetching AI usage info:", error);
      res.status(500).json({ message: "Failed to fetch AI usage info" });
    }
  });

  // ======================
  // User Routes
  // ======================
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ======================
  // Listing Routes
  // ======================

  // Get all active listings
  app.get("/api/listings", async (_req, res) => {
    try {
      const listings = await storage.getAllListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get listings by category
  app.get("/api/listings/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const listings = await storage.getListingsByCategory(category);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings by category:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Advanced search with filters
  app.get("/api/listings/search", async (req, res) => {
    try {
      const filters = {
        query: req.query.q as string | undefined,
        category: req.query.category as string | undefined,
        condition: req.query.condition as string | undefined,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        location: req.query.location as string | undefined,
        sortBy: req.query.sortBy as 'newest' | 'price-low' | 'price-high' | undefined,
      };

      const listings = await storage.advancedSearch(filters);
      res.json(listings);
    } catch (error) {
      console.error("Error searching listings:", error);
      res.status(500).json({ message: "Failed to search listings" });
    }
  });

  // Get single listing with seller info
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getListingWithSeller(id);
      if (!result) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  // Get similar listings
  app.get("/api/listings/similar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const listings = await storage.getSimilarListings(id, limit);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching similar listings:", error);
      res.status(500).json({ message: "Failed to fetch similar listings" });
    }
  });

  // Get user's listings
  app.get("/api/user/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const listings = await storage.getUserListings(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Create listing
  app.post("/api/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const validatedData = insertListingSchema.parse({
        ...req.body,
        userId,
      });
      const listing = await storage.createListing(validatedData);
      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: error.message || "Failed to create listing" });
    }
  });

  // Batch create listings
  app.post("/api/listings/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listings } = req.body;

      if (!Array.isArray(listings) || listings.length === 0) {
        return res.status(400).json({ message: "Listings array is required" });
      }

      console.log(`📦 Batch creating ${listings.length} listings for user ${userId}`);

      const createdListings = [];
      const errors = [];

      for (let i = 0; i < listings.length; i++) {
        try {
          const validatedData = insertListingSchema.parse({
            ...listings[i],
            userId,
          });
          const listing = await storage.createListing(validatedData);
          createdListings.push(listing);
          console.log(`✓ Created listing ${i + 1}/${listings.length}: ${listing.title}`);
        } catch (error: any) {
          console.error(`✗ Failed to create listing ${i + 1}:`, error.message);
          errors.push({ index: i, error: error.message });
        }
      }

      if (errors.length > 0 && createdListings.length === 0) {
        return res.status(400).json({ 
          message: "Failed to create any listings", 
          errors 
        });
      }

      res.status(201).json({ 
        created: createdListings.length,
        listings: createdListings,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error in batch listing creation:", error);
      res.status(500).json({ message: error.message || "Failed to create listings" });
    }
  });

  // Update listing
  app.put("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.userId;
      
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this listing" });
      }

      // Only allow updating specific fields, prevent privilege escalation
      const allowedFields = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        condition: req.body.condition,
        location: req.body.location,
        images: req.body.images,
      };

      // Remove undefined fields
      const updateData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
      );

      const updated = await storage.updateListing(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Delete listing
  app.delete("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.userId;
      
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this listing" });
      }

      await storage.deleteListing(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Get user's own listings
  app.get("/api/listings/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const listings = await storage.getUserListings(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  // Get dashboard stats
  app.get("/api/listings/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const stats = await storage.getUserListingsStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Update listing status
  app.put("/api/listings/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.auth.userId;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this listing" });
      }

      const updated = await storage.updateListingStatus(id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing status:", error);
      res.status(500).json({ message: "Failed to update listing status" });
    }
  });

  // ======================
  // User Profile Routes
  // ======================

  // Update user profile
  app.put("/api/users/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { firstName, lastName, profileImageUrl } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

      const updated = await storage.updateUserProfile(userId, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ======================
  // Image Upload Routes (Cloudinary)
  // ======================

  // Upload image to Cloudinary
  app.post("/api/images/upload", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      console.log('📤 Image upload request received from user:', req.auth?.userId);
      
      if (!req.file) {
        console.error('❌ No image file provided in request');
        return res.status(400).json({ message: "No image file provided" });
      }

      // Multer with CloudinaryStorage automatically uploads to Cloudinary
      // The file object contains the Cloudinary URL
      const imageUrl = (req.file as any).path; // Cloudinary URL
      
      console.log('✅ Image uploaded successfully to Cloudinary:', imageUrl);
      
      res.json({ 
        imageUrl,
        publicId: (req.file as any).filename,
      });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Upload multiple images to Cloudinary
  app.post("/api/images/upload-multiple", isAuthenticated, upload.array("images", 10), async (req: any, res) => {
    try {
      if (!req.files || (req.files as any[]).length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      const images = (req.files as any[]).map((file) => ({
        imageUrl: file.path,
        publicId: file.filename,
      }));

      res.json({ images });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // ======================
  // Upload Session Routes (QR Code phone-to-desktop uploads)
  // ======================

  // Create a new upload session
  app.post("/api/upload-session/create", isAuthenticated, async (req: any, res) => {
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

  // Upload images to a session (called from mobile)
  app.post("/api/upload-session/:id/upload", upload.array("images", 24), async (req: any, res) => {
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
      
      // Extract Cloudinary URLs
      const imageUrls = (req.files as any[]).map((file) => file.path);
      
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

  // Get images from a session (polling endpoint for desktop)
  app.get("/api/upload-session/:id/images", isAuthenticated, async (req: any, res) => {
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

  // Delete/cleanup a session
  app.delete("/api/upload-session/:id", isAuthenticated, async (req: any, res) => {
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

  // ======================
  // AI Coaching Routes
  // ======================

  // Identify product from photo
  app.post("/api/ai/analyze-photo", isAuthenticated, async (req, res) => {
    try {
      const { base64Image, photoNumber, manualCategory } = req.body;
      
      if (!base64Image) {
        return res.status(400).json({ message: "base64Image is required" });
      }

      const { aiService } = await import("./aiService");
      const productDetails = await aiService.identifyProductFromPhoto(
        base64Image,
        photoNumber || 1,
        manualCategory
      );
      
      res.json(productDetails);
    } catch (error: any) {
      console.error("Error identifying product:", error);
      res.status(500).json({ message: "Failed to identify product" });
    }
  });

  // Analyze description
  app.post("/api/ai/analyze-description", isAuthenticated, async (req, res) => {
    try {
      const { description, title, category } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "description is required" });
      }

      const { aiService } = await import("./aiService");
      const analysis = await aiService.analyzeDescription(
        description,
        title || "",
        category || "other"
      );
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing description:", error);
      res.status(500).json({ message: "Failed to analyze description" });
    }
  });

  // Analyze pricing
  app.post("/api/ai/analyze-pricing", isAuthenticated, async (req, res) => {
    try {
      const { title, description, category, condition, userPrice } = req.body;

      const { aiService } = await import("./aiService");
      const analysis = await aiService.analyzePricing(
        title || "",
        description || "",
        category || "other",
        condition || "used",
        userPrice
      );
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing pricing:", error);
      res.status(500).json({ message: "Failed to analyze pricing" });
    }
  });

  // AI-powered product recognition from image
  app.post("/api/ai/analyze-image", isAuthenticated, async (req, res) => {
    try {
      console.log('🤖 AI image analysis request received');
      const { imageUrl, manualCategory } = req.body;
      
      if (!imageUrl) {
        console.error('❌ No imageUrl provided in request');
        return res.status(400).json({ message: "imageUrl is required" });
      }

      console.log('🔍 Analyzing image with OpenAI:', imageUrl);
      if (manualCategory) {
        console.log(`📁 Using manual category override: "${manualCategory}"`);
      }
      const { analyzeProductImage } = await import("./aiService");
      const analysis = await analyzeProductImage(imageUrl, manualCategory);
      
      console.log('✅ OpenAI analysis complete:', {
        title: analysis.title,
        category: analysis.category,
        confidence: analysis.confidence,
      });
      
      res.json(analysis);
    } catch (error: any) {
      console.error("❌ Error analyzing product image:", error);
      res.status(500).json({ message: "Failed to analyze product image" });
    }
  });

  // Sequential AI item analysis with credit check and deduction
  app.post("/api/ai/analyze-item", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🤖 Sequential AI item analysis request received');
      const { imageUrl, manualCategory, itemIndex } = req.body;
      const userId = req.auth.userId;
      
      if (!imageUrl) {
        console.error('❌ No imageUrl provided in request');
        return res.status(400).json({ message: "imageUrl is required" });
      }

      console.log(`🔍 Item ${itemIndex || 'N/A'}: Checking credits for user ${userId}...`);
      
      // Check and deduct credit atomically
      const creditResult = await storage.checkAndDeductAICredit(userId);
      
      if (!creditResult.success) {
        console.log('❌ Insufficient credits - user has 0 credits remaining');
        return res.status(402).json({ 
          message: "Insufficient AI credits",
          remainingCredits: 0,
        });
      }

      console.log(`✅ Credit deducted (${creditResult.usedPurchased ? 'purchased' : 'free'}). Remaining: ${creditResult.remainingCredits}`);
      console.log(`🔍 Item ${itemIndex || 'N/A'}: Analyzing image with OpenAI...`);
      
      if (manualCategory) {
        console.log(`📁 Using manual category override: "${manualCategory}"`);
      }
      
      const { analyzeProductImage } = await import("./aiService");
      const analysis = await analyzeProductImage(imageUrl, manualCategory);
      
      console.log(`✅ Item ${itemIndex || 'N/A'}: OpenAI analysis complete - "${analysis.title}"`);
      
      res.json({
        ...analysis,
        remainingCredits: creditResult.remainingCredits,
        usedPurchased: creditResult.usedPurchased,
      });
    } catch (error: any) {
      console.error("❌ Error in sequential item analysis:", error);
      res.status(500).json({ message: "Failed to analyze item" });
    }
  });

  // AI-powered multi-image analysis to detect same vs different products
  app.post("/api/ai/analyze-multiple-images", isAuthenticated, async (req, res) => {
    try {
      console.log('🤖 Multi-image analysis request received');
      const { imageUrls, manualCategory } = req.body;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('❌ No imageUrls array provided in request');
        return res.status(400).json({ message: "imageUrls array is required" });
      }

      console.log(`🔍 Analyzing ${imageUrls.length} images with OpenAI...`);
      if (manualCategory) {
        console.log(`📁 Using manual category override: "${manualCategory}"`);
      }
      const { analyzeMultipleImages } = await import("./aiService");
      const analysis = await analyzeMultipleImages(imageUrls, manualCategory);
      
      console.log('✅ Multi-image analysis complete:', {
        scenario: analysis.scenario,
        productCount: analysis.products.length,
        message: analysis.message,
      });
      
      res.json(analysis);
    } catch (error: any) {
      console.error("❌ Error analyzing multiple images:", error);
      res.status(500).json({ message: "Failed to analyze multiple images" });
    }
  });

  // Bulk analysis - detect groupings first, then process items
  app.post("/api/ai/analyze-bulk-images", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🤖 Bulk image analysis request received');
      const { imageUrls, manualCategory } = req.body;
      const userId = req.auth.userId;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('❌ No imageUrls array provided in request');
        return res.status(400).json({ message: "imageUrls array is required" });
      }

      const totalImages = imageUrls.length;
      
      // STEP 1: Detect product groupings from ALL images (always free)
      console.log(`🔍 Step 1: Detecting products from all ${totalImages} images...`);
      const { analyzeMultipleImages } = await import("./aiService");
      const groupingAnalysis = await analyzeMultipleImages(imageUrls, manualCategory);
      
      console.log(`✅ Detection complete: Found ${groupingAnalysis.products.length} products`);
      
      // STEP 2: Generate AI descriptions for first 5 items only (demo strategy)
      const totalProducts = groupingAnalysis.products.length;
      const FREE_AI_DEMO_LIMIT = 5;
      const itemsWithAI = Math.min(FREE_AI_DEMO_LIMIT, totalProducts);
      const itemsWithoutAI = Math.max(0, totalProducts - itemsWithAI);
      
      console.log(`📦 Total products detected: ${totalProducts}`);
      console.log(`✨ Generating AI for first ${itemsWithAI} items (demo strategy)`);
      console.log(`📝 Remaining ${itemsWithoutAI} items will be empty (manual entry required)`);
      
      // STEP 3: For first 5 items, call AI to generate full descriptions
      const { analyzeProductImage } = await import("./aiService");
      const allProducts = [];
      
      for (let i = 0; i < groupingAnalysis.products.length; i++) {
        const product = groupingAnalysis.products[i];
        const imageUrlsForProduct = product.imageIndices.map(idx => imageUrls[idx]);
        
        if (i < itemsWithAI) {
          // First 5: Generate full AI descriptions
          console.log(`🤖 Generating AI description for item ${i + 1}/${itemsWithAI}...`);
          try {
            const primaryImageUrl = imageUrlsForProduct[0];
            const aiAnalysis = await analyzeProductImage(primaryImageUrl, manualCategory);
            
            console.log(`✅ AI generated: "${aiAnalysis.title}"`);
            
            allProducts.push({
              imageIndices: product.imageIndices,
              imageUrls: imageUrlsForProduct,
              title: aiAnalysis.title,
              description: aiAnalysis.description,
              category: aiAnalysis.category,
              tags: aiAnalysis.tags || [],
              retailPrice: aiAnalysis.retailPrice,
              usedPrice: aiAnalysis.usedPrice,
              condition: aiAnalysis.condition,
              confidence: aiAnalysis.confidence,
              isAIGenerated: true,
            });
          } catch (error) {
            console.error(`❌ AI generation failed for item ${i + 1}:`, error);
            // On error, return empty item
            allProducts.push({
              imageIndices: product.imageIndices,
              imageUrls: imageUrlsForProduct,
              title: '',
              description: '',
              category: '',
              tags: [],
              retailPrice: 0,
              usedPrice: 0,
              condition: '',
              confidence: 0,
              isAIGenerated: false,
            });
          }
        } else {
          // Items 6+: Empty fields for manual entry
          allProducts.push({
            imageIndices: product.imageIndices,
            imageUrls: imageUrlsForProduct,
            title: '',
            description: '',
            category: '',
            tags: [],
            retailPrice: 0,
            usedPrice: 0,
            condition: '',
            confidence: 0,
            isAIGenerated: false,
          });
        }
      }
      
      // Increment AI usage counter for items that got AI descriptions
      if (itemsWithAI > 0) {
        await storage.incrementAIUsage(userId, itemsWithAI);
        console.log(`✅ AI usage tracked: +${itemsWithAI} descriptions generated`);
      }
      
      const usageInfo = await storage.getAIUsageInfo(userId);
      console.log(`✅ Bulk analysis complete: ${itemsWithAI} with AI, ${itemsWithoutAI} manual`);
      
      // Return all products with AI/manual flags
      res.json({ 
        products: allProducts,
        groupingInfo: {
          scenario: groupingAnalysis.scenario,
          message: groupingAnalysis.message,
          totalGroups: totalProducts,
        },
        aiInfo: {
          itemsWithAI,
          itemsWithoutAI,
          totalUsedThisMonth: usageInfo.usesThisMonth,
          monthlyLimit: 5,
          nextResetDate: usageInfo.resetDate,
        }
      });
    } catch (error: any) {
      console.error("❌ Error in bulk image analysis:", error);
      res.status(500).json({ message: "Failed to analyze images" });
    }
  });

  // Generate multi-item bundle summary
  app.post("/api/ai/generate-bundle-summary", isAuthenticated, async (req, res) => {
    try {
      console.log('🎁 Bundle summary generation request received');
      const { products } = req.body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        console.error('❌ No products array provided in request');
        return res.status(400).json({ message: "products array is required" });
      }

      console.log(`🎁 Generating bundle summary for ${products.length} products...`);
      const { generateMultiItemBundleSummary } = await import("./aiService");
      const bundleSummary = await generateMultiItemBundleSummary(products);
      
      console.log('✅ Bundle summary generated:', {
        title: bundleSummary.title,
        bundlePrice: bundleSummary.suggestedBundlePrice,
      });
      
      res.json(bundleSummary);
    } catch (error: any) {
      console.error("❌ Error generating bundle summary:", error);
      res.status(500).json({ message: "Failed to generate bundle summary" });
    }
  });

  // Serve protected images
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public assets
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ======================
  // Message Routes
  // ======================

  // Get user's conversations
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const messages = await storage.getUserConversations(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages for a listing
  app.get("/api/messages/listing/:listingId", isAuthenticated, async (req, res) => {
    try {
      const { listingId } = req.params;
      const messages = await storage.getListingMessages(listingId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching listing messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.auth.userId;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // Mark message as read
  app.put("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markMessageAsRead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // ======================
  // Favorites Routes
  // ======================

  // Get user's favorites
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Check if listing is favorited (public endpoint, returns false if not authenticated)
  app.get("/api/favorites/:listingId", async (req: any, res) => {
    try {
      // If not authenticated, return false
      if (!req.auth?.userId) {
        return res.json({ isFavorited: false });
      }
      
      const userId = req.auth.userId;
      const { listingId } = req.params;
      const isFavorited = await storage.isFavorited(userId, listingId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Add to favorites
  app.post("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId,
      });
      const favorite = await storage.addFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      res.status(400).json({ message: error.message || "Failed to add favorite" });
    }
  });

  // Remove from favorites
  app.delete("/api/favorites/:listingId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;
      await storage.removeFavorite(userId, listingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Toggle favorite
  app.post("/api/favorites/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.body;
      
      if (!listingId) {
        return res.status(400).json({ message: "listingId is required" });
      }

      const result = await storage.toggleFavorite(userId, listingId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // ======================
  // Stripe Payment Routes
  // ======================

  if (process.env.STRIPE_SECRET_KEY) {
    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    });

    // Create payment intent for listing promotion or premium features
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount, description } = req.body;
        
        if (!amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          description: description || "SellFast.Now payment",
          automatic_payment_methods: {
            enabled: true,
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Stripe payment intent error:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    // Get payment status
    app.get("/api/payment-status/:paymentIntentId", isAuthenticated, async (req, res) => {
      try {
        const { paymentIntentId } = req.params;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        res.json({ status: paymentIntent.status });
      } catch (error: any) {
        console.error("Error retrieving payment status:", error);
        res.status(500).json({ message: "Error retrieving payment status: " + error.message });
      }
    });

    // Purchase AI Credits (one-time payment for 25 credits at $2.99)
    app.post("/api/purchase-ai-credits", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const AI_CREDIT_PRICE = 2.99;
        const AI_CREDIT_AMOUNT = 25;

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(AI_CREDIT_PRICE * 100),
          currency: "usd",
          description: `AI Batch - ${AI_CREDIT_AMOUNT} Items`,
          metadata: {
            userId,
            type: "ai_credits",
            credits: AI_CREDIT_AMOUNT.toString(),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        res.json({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (error: any) {
        console.error("Error creating AI credit payment:", error);
        res.status(500).json({ message: "Error creating payment: " + error.message });
      }
    });

    // Webhook to handle successful payments
    app.post("/api/stripe-webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'];
      
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send("Webhook signature missing");
      }

      let event;
      
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { userId, type, credits } = paymentIntent.metadata;

        if (type === 'ai_credits' && userId && credits) {
          try {
            await storage.addAICredits(userId, parseInt(credits));
            console.log(`Added ${credits} AI credits to user ${userId}`);
          } catch (error) {
            console.error("Error adding AI credits:", error);
          }
        }
      }

      res.json({ received: true });
    });

    // Confirm AI Credit Purchase (alternative to webhook for testing)
    app.post("/api/confirm-ai-credit-purchase", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
          return res.status(400).json({ message: "Payment Intent ID required" });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment not successful" });
        }

        if (paymentIntent.metadata.userId !== userId) {
          return res.status(403).json({ message: "Payment does not belong to you" });
        }

        const credits = parseInt(paymentIntent.metadata.credits || '0');
        if (credits > 0) {
          const updatedUser = await storage.addAICredits(userId, credits);
          res.json({ 
            success: true, 
            creditsAdded: credits,
            totalCredits: updatedUser.aiCreditsPurchased,
          });
        } else {
          res.status(400).json({ message: "Invalid credit amount" });
        }
      } catch (error: any) {
        console.error("Error confirming AI credit purchase:", error);
        res.status(500).json({ message: "Error confirming purchase: " + error.message });
      }
    });

    // Create Stripe Checkout Session for Pay-Per-Use
    app.post("/api/create-checkout-session/pay-per-use", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { itemCount } = req.body;

        if (!itemCount || itemCount <= 0) {
          return res.status(400).json({ message: "Invalid item count" });
        }

        const pricePerItem = 0.20;
        const totalAmount = Math.round(itemCount * pricePerItem * 100); // Convert to cents

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `AI Description Generation - ${itemCount} item${itemCount > 1 ? 's' : ''}`,
                  description: 'AI-powered title, description, and category generation',
                },
                unit_amount: totalAmount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=pay-per-use&items=${itemCount}`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/payment/cancel`,
          metadata: {
            userId,
            type: 'pay_per_use',
            itemCount: itemCount.toString(),
          },
        });

        res.json({ sessionId: session.id, url: session.url });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Error creating checkout session: " + error.message });
      }
    });

    // Create Stripe Checkout Session for Credit Bundles
    app.post("/api/create-checkout-session/credits", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { credits, amount } = req.body;

        if (!credits || credits <= 0 || !amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid credits or amount" });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${credits} AI Credits`,
                  description: 'Credits never expire - Use for AI-powered listing generation',
                },
                unit_amount: Math.round(amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits&credits=${credits}`,
          cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/payment/cancel`,
          metadata: {
            userId,
            type: 'credit_bundle',
            credits: credits.toString(),
          },
        });

        res.json({ sessionId: session.id, url: session.url });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Error creating checkout session: " + error.message });
      }
    });

    // Verify Checkout Session and Complete Purchase
    app.post("/api/verify-checkout-session", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { sessionId } = req.body;

        if (!sessionId) {
          return res.status(400).json({ message: "Session ID required" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
          return res.status(400).json({ message: "Payment not completed" });
        }

        if (session.metadata?.userId !== userId) {
          return res.status(403).json({ message: "Session does not belong to you" });
        }

        const type = session.metadata?.type;
        
        if (type === 'credit_bundle') {
          const credits = parseInt(session.metadata?.credits || '0');
          if (credits > 0) {
            await storage.purchaseCredits(userId, credits, session.amount_total! / 100, sessionId);
            res.json({ 
              success: true, 
              type: 'credits',
              creditsAdded: credits,
            });
          } else {
            res.status(400).json({ message: "Invalid credit amount" });
          }
        } else if (type === 'pay_per_use') {
          const itemCount = parseInt(session.metadata?.itemCount || '0');
          res.json({ 
            success: true, 
            type: 'pay_per_use',
            itemCount,
          });
        } else {
          res.status(400).json({ message: "Invalid session type" });
        }
      } catch (error: any) {
        console.error("Error verifying checkout session:", error);
        res.status(500).json({ message: "Error verifying session: " + error.message });
      }
    });
  }

  // ======================
  // Review Routes
  // ======================

  // Create a review
  app.post("/api/reviews/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId, token } = req.body;

      // If token is provided, validate and use it to derive role and target
      let reviewerRole: 'buyer' | 'seller';
      let reviewedUserId: string;
      
      if (token) {
        const reviewToken = await storage.getReviewToken(token);
        
        if (!reviewToken) {
          return res.status(400).json({ message: "Invalid token" });
        }
        
        if (reviewToken.used) {
          return res.status(400).json({ message: "Token already used" });
        }
        
        if (new Date() > reviewToken.expiresAt) {
          return res.status(400).json({ message: "Token expired" });
        }
        
        if (reviewToken.userId !== userId) {
          return res.status(403).json({ message: "Token does not belong to you" });
        }
        
        // Verify token is for this listing (prevent privilege escalation)
        if (reviewToken.listingId !== listingId) {
          return res.status(403).json({ message: "Token is not valid for this listing" });
        }
        
        // Get listing to determine role
        const listing = await storage.getListing(listingId);
        if (!listing) {
          return res.status(404).json({ message: "Listing not found" });
        }
        
        // Derive role and target from token and listing (don't trust client input)
        reviewerRole = listing.userId === reviewToken.userId ? 'seller' : 'buyer';
        
        if (reviewerRole === 'buyer') {
          reviewedUserId = listing.userId;
        } else {
          // Seller reviews buyer - find buyer from transaction
          const transactionDetails = await storage.getTransactionDetails(listing.id, reviewToken.userId);
          const buyerEvent = transactionDetails?.transactionEvents?.find(
            (e: any) => e.userId !== listing.userId && (e.eventType === 'completed' || e.eventType === 'confirmed')
          );
          reviewedUserId = buyerEvent?.userId;
          
          if (!reviewedUserId) {
            return res.status(400).json({ message: "Could not determine buyer for this transaction" });
          }
        }
        
        // Mark token as used
        await storage.markTokenAsUsed(token);
      } else {
        // Verify user is eligible to review this listing (non-token flow)
        const transactionDetails = await storage.getTransactionDetails(listingId, userId);
        if (!transactionDetails || !transactionDetails.eligibleForReview) {
          return res.status(403).json({ 
            message: "You are not eligible to review this transaction. Only buyers who completed a transaction can leave reviews." 
          });
        }
        
        // Derive role and target from transaction data (don't trust client input)
        const listing = await storage.getListing(listingId);
        if (!listing) {
          return res.status(404).json({ message: "Listing not found" });
        }
        
        reviewerRole = listing.userId === userId ? 'seller' : 'buyer';
        
        if (reviewerRole === 'buyer') {
          reviewedUserId = listing.userId;
        } else {
          // Seller reviews buyer - find buyer from transaction
          const buyerEvent = transactionDetails.transactionEvents?.find(
            (e: any) => e.userId !== listing.userId && (e.eventType === 'completed' || e.eventType === 'confirmed')
          );
          reviewedUserId = buyerEvent?.userId;
          
          if (!reviewedUserId) {
            return res.status(400).json({ message: "Could not determine buyer for this transaction" });
          }
        }
      }

      const validatedData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId,
        reviewerRole,
        reviewedUserId,
      });

      const review = await storage.createReview(validatedData);
      
      // Mark review request email as completed
      await storage.markReviewAsLeft(listingId, userId);
      
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Get reviews for a user
  app.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const filters = {
        stars: req.query.stars ? parseInt(req.query.stars as string) : undefined,
        role: req.query.role as 'seller' | 'buyer' | undefined,
        period: req.query.period as '30d' | '3m' | '6m' | '12m' | 'all' | undefined,
        sort: req.query.sort as 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful' | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const reviews = await storage.getUserReviews(userId, filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get count of reviews for a user
  app.get("/api/reviews/user/:userId/count", async (req, res) => {
    try {
      const { userId } = req.params;
      const filters = {
        stars: req.query.stars ? parseInt(req.query.stars as string) : undefined,
        role: req.query.role as 'seller' | 'buyer' | undefined,
        period: req.query.period as '30d' | '3m' | '6m' | '12m' | 'all' | undefined,
      };

      const count = await storage.getUserReviewsCount(userId, filters);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching review count:", error);
      res.status(500).json({ message: "Failed to fetch review count" });
    }
  });

  // Respond to a review
  app.post("/api/reviews/:reviewId/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { reviewId } = req.params;
      const { responseText } = req.body;

      if (!responseText || responseText.trim().length === 0) {
        return res.status(400).json({ message: "Response text is required" });
      }

      if (responseText.length > 500) {
        return res.status(400).json({ message: "Response text must be 500 characters or less" });
      }

      const review = await storage.respondToReview(reviewId, userId, responseText);
      res.json(review);
    } catch (error: any) {
      console.error("Error responding to review:", error);
      const statusCode = error.message.includes("can only be edited within") ? 403 : 
                         error.message.includes("Only the reviewed user") ? 403 : 400;
      res.status(statusCode).json({ message: error.message || "Failed to respond to review" });
    }
  });

  // Vote on a review
  app.post("/api/reviews/:reviewId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { reviewId } = req.params;
      const { voteType } = req.body;

      if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
        return res.status(400).json({ message: "Valid voteType is required (helpful or not_helpful)" });
      }

      const result = await storage.voteOnReview(reviewId, userId, voteType);
      res.json(result);
    } catch (error: any) {
      console.error("Error voting on review:", error);
      res.status(400).json({ message: error.message || "Failed to vote on review" });
    }
  });

  // Flag a review
  app.put("/api/reviews/:reviewId/flag", isAuthenticated, async (req: any, res) => {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Flag reason is required" });
      }

      const review = await storage.flagReview(reviewId, reason);
      res.json(review);
    } catch (error: any) {
      console.error("Error flagging review:", error);
      res.status(400).json({ message: error.message || "Failed to flag review" });
    }
  });

  // ======================
  // Cancellation Comment Routes
  // ======================

  // Create cancellation comment (new format matching modal)
  app.post("/api/cancellations/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { 
        listingId, 
        cancellationReason,
        cancellationComment, 
        whoInitiated,
        commenterRole 
      } = req.body;

      // Verify user is eligible to report cancellation for this listing
      const transactionDetails = await storage.getTransactionDetails(listingId, userId);
      if (!transactionDetails || !transactionDetails.eligibleForCancellationReport) {
        return res.status(403).json({ 
          message: "You are not eligible to report a cancellation for this transaction." 
        });
      }

      // Build data with server-controlled identity fields
      const validatedData = insertCancellationCommentSchema.parse({
        listingId,
        cancelledByUserId: userId, // Always use authenticated user ID
        comment: cancellationComment,
        cancelledRole: commenterRole, // Role from client, but user ID is verified
        cancellationTiming: whoInitiated,
        cancellationReasonCategory: cancellationReason,
      });

      const comment = await storage.createCancellationComment(validatedData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to create cancellation comment" });
    }
  });

  // Create cancellation comment (legacy format - now with eligibility check)
  app.post("/api/cancellations/:listingId/comment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;
      const { comment, cancelledRole, cancellationTiming, cancellationReasonCategory } = req.body;

      // Verify user is eligible to report cancellation for this listing
      const transactionDetails = await storage.getTransactionDetails(listingId, userId);
      if (!transactionDetails || !transactionDetails.eligibleForCancellationReport) {
        return res.status(403).json({ 
          message: "You are not eligible to report a cancellation for this transaction." 
        });
      }
      
      // Build data with server-controlled identity fields
      const validatedData = insertCancellationCommentSchema.parse({
        listingId,
        cancelledByUserId: userId, // Always use authenticated user ID
        comment,
        cancelledRole,
        cancellationTiming,
        cancellationReasonCategory,
      });

      const result = await storage.createCancellationComment(validatedData);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to create cancellation comment" });
    }
  });

  // Respond to cancellation comment
  app.post("/api/cancellations/:commentId/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { commentId } = req.params;
      const { responseText, isPublic = true } = req.body;

      // Validate response text
      if (!responseText || responseText.trim() === "") {
        return res.status(400).json({ message: "Response text is required" });
      }

      if (responseText.length > 500) {
        return res.status(400).json({ message: "Response must be 500 characters or less" });
      }

      // Get the cancellation comment
      const comment = await storage.getCancellationComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Cancellation comment not found" });
      }

      // Check if user has already responded
      if (comment.responseByUserId) {
        return res.status(403).json({ message: "You have already responded to this cancellation comment" });
      }

      // Get listing and transaction events to verify user is a participant
      const listing = await storage.getListing(comment.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Get transaction events to find the buyer
      const events = await db
        .select()
        .from(transactionEvents)
        .where(eq(transactionEvents.listingId, comment.listingId))
        .limit(1);

      if (events.length === 0) {
        return res.status(404).json({ message: "Transaction event not found" });
      }

      const buyerId = events[0].userId;
      const sellerId = listing.userId;

      // Verify user is a participant in the transaction
      const isSeller = sellerId === userId;
      const isBuyer = buyerId === userId;
      const isCanceller = comment.cancelledByUserId === userId;

      // User must be either the seller or the buyer to be a participant
      if (!isSeller && !isBuyer) {
        return res.status(403).json({ message: "You are not a participant in this transaction" });
      }

      // Verify user is the OTHER party (not the one who cancelled)
      if (isCanceller) {
        return res.status(403).json({ 
          message: "You cannot respond to your own cancellation comment" 
        });
      }

      // Create response
      const updatedComment = await storage.respondToCancellationComment(
        commentId, 
        userId, 
        responseText, 
        isPublic
      );
      res.json(updatedComment);
    } catch (error: any) {
      console.error("Error responding to cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to respond to cancellation comment" });
    }
  });

  // Vote on cancellation comment
  app.post("/api/cancellations/:commentId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { commentId } = req.params;
      const { voteType } = req.body;

      if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
        return res.status(400).json({ message: "Valid voteType is required (helpful or not_helpful)" });
      }

      const result = await storage.voteOnCancellationComment(commentId, userId, voteType);
      res.json(result);
    } catch (error: any) {
      console.error("Error voting on cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to vote on cancellation comment" });
    }
  });

  // ======================
  // User Statistics Routes
  // ======================

  // Get user statistics
  app.get("/api/statistics/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserStatistics(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Get user transaction timeline
  app.get("/api/statistics/user/:userId/timeline", async (req, res) => {
    try {
      const { userId } = req.params;
      const timeline = await storage.getUserTransactionTimeline(userId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching user timeline:", error);
      res.status(500).json({ message: "Failed to fetch user timeline" });
    }
  });

  // Get user monthly statistics
  app.get("/api/statistics/user/:userId/monthly", async (req, res) => {
    try {
      const { userId } = req.params;
      const months = req.query.months ? parseInt(req.query.months as string) : 3;
      const monthlyStats = await storage.getUserMonthlyStatistics(userId, months);
      res.json(monthlyStats);
    } catch (error) {
      console.error("Error fetching user monthly statistics:", error);
      res.status(500).json({ message: "Failed to fetch user monthly statistics" });
    }
  });

  // Get user statistics summary (for offer decision-making)
  app.get("/api/statistics/user/:userId/summary", async (req, res) => {
    try {
      const { userId } = req.params;
      const summary = await storage.getUserStatisticsSummary(userId);
      
      if (!summary) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching user statistics summary:", error);
      res.status(500).json({ message: "Failed to fetch user statistics summary" });
    }
  });

  // Update statistics on transaction completion (triggers auto-update)
  app.post("/api/statistics/update-on-completion/:transactionId", isAuthenticated, async (req: any, res) => {
    try {
      const { transactionId } = req.params;
      await storage.updateStatisticsOnCompletion(transactionId);
      res.json({ success: true, message: "Statistics updated on completion" });
    } catch (error: any) {
      console.error("Error updating statistics on completion:", error);
      res.status(400).json({ message: error.message || "Failed to update statistics" });
    }
  });

  // Update statistics on transaction cancellation (triggers auto-update)
  app.post("/api/statistics/update-on-cancellation/:transactionId", isAuthenticated, async (req: any, res) => {
    try {
      const { transactionId } = req.params;
      await storage.updateStatisticsOnCancellation(transactionId);
      res.json({ success: true, message: "Statistics updated on cancellation" });
    } catch (error: any) {
      console.error("Error updating statistics on cancellation:", error);
      res.status(400).json({ message: error.message || "Failed to update statistics" });
    }
  });

  // Manually recalculate user statistics
  app.post("/api/statistics/recalculate/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.recalculateUserStatistics(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error recalculating user statistics:", error);
      res.status(400).json({ message: error.message || "Failed to recalculate statistics" });
    }
  });

  // ======================
  // Transaction History Routes
  // ======================

  // Get user transaction history
  app.get("/api/transactions/user/:userId/history", async (req, res) => {
    try {
      const { userId } = req.params;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const sort = req.query.sort as string | undefined;

      const history = await storage.getUserTransactionHistory(userId, role, status, sort);
      res.json(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ message: "Failed to fetch transaction history" });
    }
  });

  // Get transaction details with reviews and comments
  // Note: Accessible by both authenticated and unauthenticated users
  // Eligibility flags are only computed for authenticated users
  app.get("/api/transactions/:listingId/details", async (req: any, res) => {
    try {
      const { listingId } = req.params;
      // req.auth is populated by Clerk middleware if user is logged in
      const currentUserId = req.auth?.userId || null;
      
      const details = await storage.getTransactionDetails(listingId, currentUserId);
      if (!details) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(details);
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      res.status(500).json({ message: "Failed to fetch transaction details" });
    }
  });

  // Cancel transaction with comment
  app.post("/api/listings/:listingId/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;
      const { reasonCategory, comment, isPublic, scheduledMeetupTime } = req.body;

      // Get transaction details to verify user eligibility
      const transactionDetails = await storage.getTransactionDetails(listingId, userId);
      
      if (!transactionDetails) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Verify user can cancel this transaction
      if (!transactionDetails.canCancelTransaction) {
        return res.status(403).json({ 
          message: "You are not authorized to cancel this transaction" 
        });
      }

      // Determine the actual role from the transaction details
      const cancelledBy = transactionDetails.userRole;
      
      if (!cancelledBy) {
        return res.status(403).json({ 
          message: "Could not determine your role in this transaction" 
        });
      }

      // Import cancellation utils
      const { calculateCancellationTiming } = await import("./cancellationUtils");
      
      // Calculate timing if meetup time provided
      const cancellationTiming = calculateCancellationTiming(scheduledMeetupTime);

      // Create cancellation event
      await db.insert(transactionEvents).values({
        listingId,
        userId,
        eventType: "cancelled",
        eventData: { cancelledBy, timing: cancellationTiming },
      });

      // Create cancellation comment if provided
      if (comment && comment.trim()) {
        const validatedData = insertCancellationCommentSchema.parse({
          listingId,
          cancelledByUserId: userId,
          comment: comment.trim(),
          cancelledRole: cancelledBy,
          cancellationTiming,
          cancellationReasonCategory: reasonCategory,
          isPublic: isPublic ?? true,
        });

        await storage.createCancellationComment(validatedData);
      }

      // TODO: Process deposit refund
      // TODO: Send email notification

      res.json({ 
        success: true, 
        message: "Transaction cancelled successfully",
        timing: cancellationTiming,
      });
    } catch (error: any) {
      console.error("Error cancelling transaction:", error);
      res.status(400).json({ message: error.message || "Failed to cancel transaction" });
    }
  });

  // ======================
  // Offer Routes
  // ======================

  // Create a new offer on a listing
  app.post("/api/listings/:listingId/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;
      const { offerAmount, depositAmount, message } = req.body;

      // Get listing to verify it exists and get seller ID
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Prevent user from making offer on their own listing
      if (listing.userId === userId) {
        return res.status(400).json({ message: "You cannot make an offer on your own listing" });
      }

      // Create offer
      const offer = await storage.createOffer({
        listingId,
        buyerId: userId,
        sellerId: listing.userId,
        offerAmount,
        depositAmount: depositAmount || 0,
        message: message || null,
        status: "pending",
      });

      res.status(201).json(offer);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      res.status(400).json({ message: error.message || "Failed to create offer" });
    }
  });

  // Get all offers for a listing (seller only)
  app.get("/api/listings/:listingId/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;

      // Verify user is the seller
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ message: "You can only view offers on your own listings" });
      }

      const offers = await storage.getListingOffers(listingId);
      res.json(offers);
    } catch (error: any) {
      console.error("Error fetching listing offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Get offers made by user
  app.get("/api/offers/made", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const offers = await storage.getUserOffersMade(userId);
      res.json(offers);
    } catch (error: any) {
      console.error("Error fetching user offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Get offers received by user
  app.get("/api/offers/received", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const offers = await storage.getUserOffersReceived(userId);
      res.json(offers);
    } catch (error: any) {
      console.error("Error fetching received offers:", error);
      res.status(500).json({ message: "Failed to fetch received offers" });
    }
  });

  // Accept an offer
  app.patch("/api/offers/:offerId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { offerId } = req.params;

      // Get offer details
      const offerDetails = await storage.getOffer(offerId);
      if (!offerDetails) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Verify user is the seller
      if (offerDetails.offer.sellerId !== userId) {
        return res.status(403).json({ message: "Only the seller can accept offers" });
      }

      // Update offer status
      const updatedOffer = await storage.updateOfferStatus(offerId, "accepted");

      // TODO: Create transaction event
      // TODO: Process deposit
      // TODO: Send notifications

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      res.status(400).json({ message: error.message || "Failed to accept offer" });
    }
  });

  // Decline an offer
  app.patch("/api/offers/:offerId/decline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { offerId } = req.params;

      // Get offer details
      const offerDetails = await storage.getOffer(offerId);
      if (!offerDetails) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Verify user is the seller
      if (offerDetails.offer.sellerId !== userId) {
        return res.status(403).json({ message: "Only the seller can decline offers" });
      }

      // Update offer status
      const updatedOffer = await storage.updateOfferStatus(offerId, "declined");

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error declining offer:", error);
      res.status(400).json({ message: error.message || "Failed to decline offer" });
    }
  });

  // Counter an offer
  app.patch("/api/offers/:offerId/counter", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { offerId } = req.params;
      const { counterOfferAmount, counterOfferMessage } = req.body;

      // Get offer details
      const offerDetails = await storage.getOffer(offerId);
      if (!offerDetails) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Verify user is the seller
      if (offerDetails.offer.sellerId !== userId) {
        return res.status(403).json({ message: "Only the seller can counter offers" });
      }

      // Update offer with counter
      const updatedOffer = await storage.updateOfferStatus(offerId, "countered", {
        counterOfferAmount,
        counterOfferMessage: counterOfferMessage || null,
      });

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error countering offer:", error);
      res.status(400).json({ message: error.message || "Failed to counter offer" });
    }
  });

  // Withdraw an offer (buyer)
  app.patch("/api/offers/:offerId/withdraw", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { offerId } = req.params;

      // Get offer details
      const offerDetails = await storage.getOffer(offerId);
      if (!offerDetails) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Verify user is the buyer
      if (offerDetails.offer.buyerId !== userId) {
        return res.status(403).json({ message: "Only the buyer can withdraw their offer" });
      }

      // Update offer status
      const updatedOffer = await storage.updateOfferStatus(offerId, "withdrawn");

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error withdrawing offer:", error);
      res.status(400).json({ message: error.message || "Failed to withdraw offer" });
    }
  });

  // ======================
  // Review Request Email Routes
  // ======================

  // Send review request emails for a completed transaction (manual trigger)
  app.post("/api/email/review-request/:listingId", isAuthenticated, async (req: any, res) => {
    try {
      const { listingId } = req.params;
      const { sendReviewRequestEmails } = await import("./reviewEmailService");
      
      await sendReviewRequestEmails(listingId);
      
      res.json({ success: true, message: "Review request emails sent" });
    } catch (error: any) {
      console.error("Error sending review request emails:", error);
      res.status(500).json({ message: error.message || "Failed to send review request emails" });
    }
  });

  // Validate review token
  app.get("/api/reviews/validate-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const reviewToken = await storage.getReviewToken(token);
      
      if (!reviewToken) {
        return res.status(404).json({ message: "Invalid token" });
      }
      
      if (reviewToken.used) {
        return res.status(400).json({ message: "Token already used" });
      }
      
      if (new Date() > reviewToken.expiresAt) {
        return res.status(400).json({ message: "Token expired" });
      }
      
      const listing = await storage.getListing(reviewToken.listingId);
      const user = await storage.getUser(reviewToken.userId);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Determine role and who to review
      const reviewerRole = listing.userId === reviewToken.userId ? 'seller' : 'buyer';
      let reviewedUserId: string | null = null;
      
      if (reviewerRole === 'buyer') {
        // Buyer reviews seller
        reviewedUserId = listing.userId;
      } else {
        // Seller reviews buyer - need to find buyer from transaction
        const transactionDetails = await storage.getTransactionDetails(listing.id, reviewToken.userId);
        const buyerEvent = transactionDetails?.transactionEvents?.find(
          (e: any) => e.userId !== listing.userId && (e.eventType === 'completed' || e.eventType === 'confirmed')
        );
        reviewedUserId = buyerEvent?.userId || null;
      }
      
      res.json({
        valid: true,
        token,
        listingId: reviewToken.listingId,
        userId: reviewToken.userId,
        reviewerRole,
        reviewedUserId,
        listing,
        user,
      });
    } catch (error: any) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Unsubscribe from review reminder emails
  app.get("/api/unsubscribe/review-reminders", async (req, res) => {
    try {
      const { user: userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: "User ID required" });
      }
      
      await storage.updateUserProfile(userId, { reviewEmailsEnabled: false });
      
      res.json({ 
        success: true, 
        message: "You've been unsubscribed from review reminder emails" 
      });
    } catch (error: any) {
      console.error("Error unsubscribing from review reminders:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Cron job endpoint for sending review reminders (should be called by external scheduler)
  app.post("/api/cron/send-review-reminders", async (req, res) => {
    try {
      const { sendReviewReminders } = await import("./reviewEmailService");
      await sendReviewReminders();
      
      res.json({ success: true, message: "Review reminders sent" });
    } catch (error: any) {
      console.error("Error sending review reminders:", error);
      res.status(500).json({ message: error.message || "Failed to send review reminders" });
    }
  });

  // ======================
  // Credit System Routes
  // ======================

  // Get user credits
  app.get("/api/user/credits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get or create user credits record
      let credits = await storage.getUserCredits(userId);
      if (!credits) {
        credits = await storage.createOrUpdateUserCredits(userId, user.email!);
      }

      res.json(credits);
    } catch (error: any) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Get credit transactions history
  app.get("/api/user/credit-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const transactions = await storage.getCreditTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching credit transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Purchase credits
  app.post("/api/credits/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { amount, cost, stripePaymentId } = req.body;

      if (!amount || !cost) {
        return res.status(400).json({ message: "Amount and cost are required" });
      }

      const updatedCredits = await storage.purchaseCredits(
        userId,
        amount,
        cost,
        stripePaymentId
      );

      res.json(updatedCredits);
    } catch (error: any) {
      console.error("Error purchasing credits:", error);
      res.status(500).json({ message: error.message || "Failed to purchase credits" });
    }
  });

  // Use credits
  app.post("/api/credits/use", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { amount, description } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const updatedCredits = await storage.useCredits(userId, amount, description);
      res.json(updatedCredits);
    } catch (error: any) {
      console.error("Error using credits:", error);
      
      if (error.message === "Insufficient credits") {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      res.status(500).json({ message: error.message || "Failed to use credits" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
