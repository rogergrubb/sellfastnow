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
import { eq } from "drizzle-orm";
import transactionRoutes from "./routes/transactions";

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
  // Transaction Routes (NEW - ENABLED)
  // ======================
  app.use("/api/transactions", transactionRoutes);

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

  // Update user profile
  app.put("/api/users/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { 
        firstName, 
        lastName, 
        profileImageUrl,
        bio,
        location,
        reviewEmailsEnabled 
      } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (reviewEmailsEnabled !== undefined) updateData.reviewEmailsEnabled = reviewEmailsEnabled;

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

      // Handle Payment Intent success (legacy)
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

      // Handle Checkout Session completion (Payment Links)
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('No client_reference_id in checkout session');
          return res.json({ received: true });
        }
        
        // Determine credits based on amount
        const amount = (session.amount_total || 0) / 100; // Convert from cents
        let creditsToAdd = 0;
        
        if (amount === 2.99) creditsToAdd = 25;
        else if (amount === 4.99) creditsToAdd = 50;
        else if (amount === 6.99) creditsToAdd = 75;
        else if (amount === 8.99) creditsToAdd = 100;
        else if (amount === 39.99) creditsToAdd = 500;
        
        if (creditsToAdd > 0) {
          try {
            await storage.purchaseCredits(userId, creditsToAdd, amount, session.id);
            console.log(`✅ Webhook: Added ${creditsToAdd} credits to user ${userId} from checkout session`);
          } catch (error) {
            console.error("Error adding credits from checkout session:", error);
          }
        } else {
          console.warn(`Unknown amount in checkout session: $${amount}`);
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
          await storage.addAICredits(userId, credits);
          res.json({ 
            success: true, 
            creditsAdded: credits,
          });
        } else {
          res.status(400).json({ message: "Invalid credit amount" });
        }
      } catch (error: any) {
        console.error("Error confirming AI credit purchase:", error);
        res.status(500).json({ message: "Error confirming purchase: " + error.message });
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

  // ======================
  // Listing Routes
  // ======================

  // Batch create listings (for AI-generated items)
  app.post("/api/listings/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listings: listingsData } = req.body;

      if (!listingsData || !Array.isArray(listingsData)) {
        return res.status(400).json({ message: "listings array is required" });
      }

      console.log(`📦 Batch creating ${listingsData.length} listings for user ${userId}`);

      const createdListings = [];
      const errors = [];

      for (let i = 0; i < listingsData.length; i++) {
        try {
          const listingData = listingsData[i];
          
          // Validate required fields
          if (!listingData.title || !listingData.description || !listingData.price || 
              !listingData.category || !listingData.condition) {
            errors.push({ index: i, error: "Missing required fields" });
            continue;
          }

          const listing = await storage.createListing({
            userId,
            title: listingData.title,
            description: listingData.description,
            price: String(listingData.price),
            category: listingData.category,
            condition: listingData.condition,
            location: listingData.location || "Local Area",
            images: listingData.images || [],
            status: "active",
          });

          createdListings.push(listing);
          console.log(`✅ Created listing ${i + 1}/${listingsData.length}: ${listing.title}`);
        } catch (error: any) {
          console.error(`❌ Error creating listing ${i + 1}:`, error);
          errors.push({ index: i, error: error.message });
        }
      }

      console.log(`✅ Batch create complete: ${createdListings.length} created, ${errors.length} errors`);

      res.json({
        created: createdListings.length,
        listings: createdListings,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("❌ Batch create listings error:", error);
      res.status(500).json({ message: error.message || "Failed to create listings" });
    }
  });

  /* 
  ==============================================================================
  TEMPORARILY DISABLED ROUTES
  ==============================================================================
  
  The following routes are temporarily disabled because they depend on database
  tables/schemas that haven't been migrated yet:
  
  - Additional Listing Routes (search, update, delete)
  - Message Routes (insertMessageSchema)
  - Favorite Routes (insertFavoriteSchema)
  - Review Routes (insertReviewSchema)
  - Cancellation Comment Routes (insertCancellationCommentSchema)
  - Transaction History Routes (transactionEvents)
  - Offer Routes
  - Review Email Routes
  
  These will be re-enabled once the full schema is migrated.
  ==============================================================================
  */

  const httpServer = createServer(app);
  return httpServer;
}
