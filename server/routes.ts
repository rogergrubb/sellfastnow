// Comprehensive API routes for SellFast.Now marketplace
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { upload } from "./cloudinary";
import { eq } from "drizzle-orm";
import transactionRoutes from "./routes/transactions";
import reviewRoutes from "./routes/reviews";
import reputationRoutes from "./routes/reputation";
import stripeConnectRoutes from "./routes/stripe-connect";
import paymentSessionRoutes from "./routes/payment-sessions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // ======================
  // Health Check Endpoint
  // ======================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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
  
  // Get pending transactions for current user
  app.get("/api/transactions/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      
      // Get all transactions where user is buyer or seller and status requires action
      const pendingStatuses = ['pending_payment', 'escrow', 'pending_meetup'];
      
      const transactions = await db
        .select({
          id: transactionsTable.id,
          listingId: transactionsTable.listingId,
          amount: transactionsTable.amount,
          status: transactionsTable.status,
          createdAt: transactionsTable.createdAt,
          buyerId: transactionsTable.buyerId,
          sellerId: transactionsTable.sellerId,
          listingTitle: listings.title,
          listingImage: sql<string>`(
            SELECT "imageUrl" 
            FROM listing_images 
            WHERE "listingId" = ${transactionsTable.listingId} 
            ORDER BY "order" ASC 
            LIMIT 1
          )`,
        })
        .from(transactionsTable)
        .leftJoin(listings, eq(transactionsTable.listingId, listings.id))
        .where(
          and(
            or(
              eq(transactionsTable.buyerId, userId),
              eq(transactionsTable.sellerId, userId)
            ),
            sql`${transactionsTable.status} IN (${sql.join(pendingStatuses.map(s => sql`${s}`), sql`, `)})`
          )
        )
        .orderBy(desc(transactionsTable.createdAt));

      // Enrich with other party information
      const enrichedTransactions = await Promise.all(
        transactions.map(async (tx) => {
          const isBuyer = tx.buyerId === userId;
          const otherPartyId = isBuyer ? tx.sellerId : tx.buyerId;
          
          const otherParty = await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, otherPartyId))
            .limit(1);

          return {
            ...tx,
            role: isBuyer ? 'buyer' : 'seller',
            otherPartyName: otherParty[0] 
              ? `${otherParty[0].firstName} ${otherParty[0].lastName}`
              : 'Unknown User',
          };
        })
      );

      res.json(enrichedTransactions);
    } catch (error: any) {
      console.error("Error fetching pending transactions:", error);
      res.status(500).json({ message: "Failed to fetch pending transactions" });
    }
  });

  // ======================
  // Stripe Connect Routes
  // ======================
  app.use("/api/stripe-connect", stripeConnectRoutes);

  // ======================
  // Payment Session Routes
  // ======================
  app.use("/api/payment-sessions", paymentSessionRoutes);

  // ======================
  // Review Routes
  // ======================
  app.use("/api/reviews", reviewRoutes);

  // ======================
  // Reputation Routes
  // ======================
  app.use("/api/reputation", reputationRoutes);

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

  // Get top-rated users
  app.get("/api/users/top-rated", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const { userStatistics, users } = await import("../shared/schema");
      const { desc } = await import("drizzle-orm");
      
      const topUsers = await db.query.userStatistics.findMany({
        limit,
        orderBy: [desc(userStatistics.averageRating), desc(userStatistics.totalReviewsReceived)],
        where: (stats, { gte }) => gte(stats.totalReviewsReceived, 5),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
        },
      });

      const formattedUsers = topUsers.map((stat: any) => ({
        id: stat.user.id,
        firstName: stat.user.firstName,
        lastName: stat.user.lastName,
        profileImageUrl: stat.user.profileImageUrl,
        rating: parseFloat(stat.averageRating || "0"),
        transactions: (stat.totalSales || 0) + (stat.totalPurchases || 0),
      }));

      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching top-rated users:", error);
      res.status(500).json({ message: "Failed to fetch top-rated users" });
    }
  });

  // ======================
  // Location Routes
  // ======================
  
  // Auto-detect location from IP
  app.get("/api/location/detect", async (req, res) => {
    try {
      const { detectLocationWithFallback, getClientIP } = await import("./geolocation");
      const clientIP = getClientIP(req);
      console.log(`🌍 Location detection requested from IP: ${clientIP}`);
      
      const location = await detectLocationWithFallback(clientIP);
      res.json(location);
    } catch (error) {
      console.error("Error detecting location:", error);
      res.status(500).json({ message: "Failed to detect location" });
    }
  });
  
  // Update user location
  app.put("/api/user/location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { city, region, country, postalCode, latitude, longitude, displayPrecision } = req.body;
      
      if (!city || !country) {
        return res.status(400).json({ message: "City and country are required" });
      }
      
      const updateData: any = {
        locationCity: city,
        locationRegion: region || null,
        locationCountry: country,
        locationPostalCode: postalCode || null,
        locationLatitude: latitude ? latitude.toString() : null,
        locationLongitude: longitude ? longitude.toString() : null,
        locationDisplayPrecision: displayPrecision || 'city',
        // Also update legacy location field for compatibility
        location: `${city}, ${region ? region + ', ' : ''}${country}`,
      };
      
      const updated = await storage.updateUserProfile(userId, updateData);
      console.log(`✅ Location updated for user ${userId}: ${city}, ${country}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
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
  // Phone Verification Routes (Twilio)
  // ======================
  const { sendVerificationCode, verifyCode } = await import('./twilioVerify');

  // Send phone verification code
  app.post("/api/phone/send-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const result = await sendVerificationCode(phoneNumber);
      
      if (result.success) {
        res.json({ message: "Verification code sent successfully" });
      } else {
        res.status(400).json({ message: result.error || "Failed to send verification code" });
      }
    } catch (error: any) {
      console.error("❌ Error sending verification code:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify phone code
  app.post("/api/phone/verify-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and verification code are required" });
      }

      const result = await verifyCode(phoneNumber, code);
      
      if (result.success) {
        // Update user's phoneVerified status in database
        await storage.updateUserProfile(userId, { 
          phoneVerified: true,
          verifiedAt: new Date()
        });
        
        res.json({ message: "Phone number verified successfully" });
      } else {
        res.status(400).json({ message: result.error || "Invalid verification code" });
      }
    } catch (error: any) {
      console.error("❌ Error verifying code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Check if phone verification is available
  app.get("/api/phone/status", async (req, res) => {
    const configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
    res.json({ 
      available: configured,
      message: configured
        ? "Phone verification is available" 
        : "Phone verification is not configured"
    });
  });

  // ======================
  // User Settings Routes
  // ======================

  // Update user settings (comprehensive)
  app.put("/api/user/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const updateData: any = {};
      
      // Profile Information
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio;
      
      // Location
      if (req.body.locationCity !== undefined) updateData.locationCity = req.body.locationCity;
      if (req.body.locationRegion !== undefined) updateData.locationRegion = req.body.locationRegion;
      if (req.body.locationCountry !== undefined) updateData.locationCountry = req.body.locationCountry;
      if (req.body.locationPostalCode !== undefined) updateData.locationPostalCode = req.body.locationPostalCode;
      if (req.body.locationLatitude !== undefined) updateData.locationLatitude = req.body.locationLatitude;
      if (req.body.locationLongitude !== undefined) updateData.locationLongitude = req.body.locationLongitude;
      
      // Contact Preferences
      if (req.body.contactEmail !== undefined) updateData.contactEmail = req.body.contactEmail;
      if (req.body.contactPreference !== undefined) updateData.contactPreference = req.body.contactPreference;
      if (req.body.showEmailPublicly !== undefined) updateData.showEmailPublicly = req.body.showEmailPublicly;
      if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
      if (req.body.sharePhoneWhen !== undefined) updateData.sharePhoneWhen = req.body.sharePhoneWhen;
      if (req.body.shareEmailWhen !== undefined) updateData.shareEmailWhen = req.body.shareEmailWhen;
      
      // Privacy Settings
      if (req.body.profileVisibility !== undefined) updateData.profileVisibility = req.body.profileVisibility;
      if (req.body.showLastActive !== undefined) updateData.showLastActive = req.body.showLastActive;
      if (req.body.showItemsSold !== undefined) updateData.showItemsSold = req.body.showItemsSold;
      if (req.body.allowMessagesFrom !== undefined) updateData.allowMessagesFrom = req.body.allowMessagesFrom;
      if (req.body.requireVerifiedToContact !== undefined) updateData.requireVerifiedToContact = req.body.requireVerifiedToContact;
      
      // Meeting Preferences
      if (req.body.preferredMeetingLocations !== undefined) updateData.preferredMeetingLocations = req.body.preferredMeetingLocations;
      if (req.body.availableTimes !== undefined) updateData.availableTimes = req.body.availableTimes;
      if (req.body.willingToShip !== undefined) updateData.willingToShip = req.body.willingToShip;
      if (req.body.shippingFeeAmount !== undefined) updateData.shippingFeeAmount = req.body.shippingFeeAmount;

      console.log("💾 Updating user settings:", { userId, fieldCount: Object.keys(updateData).length });
      console.log("📝 Update data:", JSON.stringify(updateData, null, 2));

      const updatedUser = await storage.updateUserProfile(userId, updateData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("❌ Error updating settings:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ 
        message: error.message || "Failed to update settings",
        error: error.toString()
      });
    }
  });

  // Sync email verification from Clerk (one-time fix for existing users)
  app.post("/api/user/sync-verification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      
      // Get current user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If already verified, no need to update
      if (user.emailVerified) {
        return res.json({ 
          message: "Email already verified",
          emailVerified: true 
        });
      }
      
      // Update emailVerified to true (user is authenticated via Clerk, so email must be verified)
      await storage.updateUserProfile(userId, {
        emailVerified: true,
      });
      
      console.log(`✅ Synced email verification for user: ${user.email}`);
      
      res.json({ 
        message: "Email verification status synced successfully",
        emailVerified: true 
      });
    } catch (error: any) {
      console.error("❌ Error syncing verification:", error);
      res.status(500).json({ 
        message: error.message || "Failed to sync verification status"
      });
    }
  });

  // ======================
  // Image Upload Routes (Cloudflare R2 + Images)
  // ======================

  // Upload image to Cloudflare
  app.post("/api/images/upload", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      console.log('📤 Image upload request received from user:', req.auth?.userId);
      
      if (!req.file) {
        console.error('❌ No image file provided in request');
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to Cloudflare R2 + Images
      const { uploadToCloudflare } = await import('./cloudflareStorage');
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

  // Upload multiple images to Cloudflare (PARALLEL - NO DELAYS!)
  app.post("/api/images/upload-multiple", isAuthenticated, upload.array("images", 200), async (req: any, res) => {
    try {
      if (!req.files || (req.files as any[]).length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      console.log(`📤 Uploading ${(req.files as any[]).length} images to Cloudflare in parallel...`);
      
      // Upload all images in parallel to Cloudflare
      const { uploadMultipleToCloudflare } = await import('./cloudflareStorage');
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
      
      // Upload images to Cloudflare
      const { uploadMultipleToCloudflare } = await import('./cloudflareStorage');
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
      const { analyzeProductImage } = await import("./aiServiceGemini");
      const analysis = await analyzeProductImage(imageUrl, 1, manualCategory);
      
      console.log('✅ Gemini analysis complete:', {
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
      
      const { analyzeProductImage } = await import("./aiServiceGemini");
      const analysis = await analyzeProductImage(imageUrl, itemIndex || 1, manualCategory);
      
      console.log(`✅ Item ${itemIndex || 'N/A'}: Gemini analysis complete - "${analysis.title}"`);
      
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
      const { analyzeMultipleImages } = await import("./aiServiceGemini");
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
      const { analyzeMultipleImages } = await import("./aiServiceGemini");
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
      
      // STEP 3: For first 5 items, call AI to generate full descriptions IN PARALLEL
      const { analyzeProductImage } = await import("./aiServiceGemini");
      
      console.log(`⚡ Running AI analysis in PARALLEL for ${itemsWithAI} items...`);
      const startTime = Date.now();
      
      // Create promises for all AI analyses to run in parallel
      const aiPromises = groupingAnalysis.products.map(async (product, i) => {
        const imageUrlsForProduct = product.imageIndices.map(idx => imageUrls[idx]);
        
        if (i < itemsWithAI) {
          // First 5: Generate full AI descriptions
          console.log(`🤖 [${i + 1}/${itemsWithAI}] Starting AI analysis...`);
          try {
            const primaryImageUrl = imageUrlsForProduct[0];
            const aiAnalysis = await analyzeProductImage(primaryImageUrl, i + 1, manualCategory);
            
            console.log(`✅ [${i + 1}/${itemsWithAI}] AI generated: "${aiAnalysis.title}"`);
            
            return {
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
            };
          } catch (error) {
            console.error(`❌ [${i + 1}/${itemsWithAI}] AI generation failed:`, error);
            // On error, return empty item
            return {
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
            };
          }
        } else {
          // Items 6+: Empty fields for manual entry
          return {
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
          };
        }
      });
      
      // Wait for all AI analyses to complete in parallel
      const allProducts = await Promise.all(aiPromises);
      const endTime = Date.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`⚡ PARALLEL AI analysis complete in ${totalTime}s (was ~${itemsWithAI * 60}s sequentially)`);
      
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
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      if (error.response) {
        console.error("❌ Error response:", error.response);
      }
      res.status(500).json({ 
        message: "Failed to analyze images",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  // Generate AI description for a single product (used for remaining items after credit purchase)
  app.post("/api/ai/identify-product", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🤖 Single product identification request received');
      const { imageUrl, manualCategory } = req.body;
      const userId = req.auth.userId;
      
      if (!imageUrl) {
        console.error('❌ No imageUrl provided in request');
        return res.status(400).json({ message: "imageUrl is required" });
      }

      console.log(`🔍 Analyzing single product image: ${imageUrl.substring(0, 80)}...`);
      const { analyzeProductImage } = await import("./aiServiceGemini");
      
      try {
        const analysis = await analyzeProductImage(imageUrl, 1, manualCategory);
        console.log(`✅ Product identified: "${analysis.title}"`);
        
        res.json({
          title: analysis.title,
          description: analysis.description,
          category: analysis.category,
          tags: analysis.tags || [],
          retailPrice: analysis.retailPrice,
          usedPrice: analysis.usedPrice,
          condition: analysis.condition,
          confidence: analysis.confidence,
        });
      } catch (aiError: any) {
        // If Gemini API fails, log the error but return empty data instead of 500
        console.error("❌ Gemini API error for image:", imageUrl.substring(0, 80));
        console.error("❌ Error details:", aiError.message);
        
        // Check if it's a quota error
        if (aiError.message && aiError.message.includes('quota')) {
          console.error("⚠️ QUOTA EXCEEDED - Consider upgrading Gemini API plan");
        }
        
        // Return empty data so frontend can continue processing other items
        res.json({
          title: '',
          description: '',
          category: '',
          tags: [],
          retailPrice: 0,
          usedPrice: 0,
          condition: '',
          confidence: 0,
          error: 'AI generation failed'
        });
      }
    } catch (error: any) {
      console.error("❌ Error in identify-product endpoint:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to identify product", error: error.message });
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

    // Create Checkout Session for credit purchases
    app.post("/api/create-checkout-session", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { credits } = req.body;

        if (!credits || credits <= 0) {
          return res.status(400).json({ message: "Invalid credit amount" });
        }

        // Define credit bundles with pricing
        const CREDIT_BUNDLES: Record<number, { price: number; name: string }> = {
          25: { price: 2.99, name: "25 AI Credits" },
          50: { price: 4.99, name: "50 AI Credits" },
          75: { price: 6.99, name: "75 AI Credits" },
          100: { price: 8.99, name: "100 AI Credits" },
          500: { price: 39.99, name: "500 AI Credits" },
        };

        const bundle = CREDIT_BUNDLES[credits];
        if (!bundle) {
          return res.status(400).json({ message: "Invalid credit bundle" });
        }

        // Get user email for prefilling
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Determine base URL for success/cancel redirects
        const baseUrl = process.env.NODE_ENV === 'production'
          ? 'https://sellfast.now'
          : 'http://localhost:5000';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: bundle.name,
                  description: `Purchase ${credits} AI credits for automatic product descriptions`,
                },
                unit_amount: Math.round(bundle.price * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
          client_reference_id: userId,
          customer_email: user.email || undefined,
          metadata: {
            userId,
            credits: credits.toString(),
            type: 'credit_bundle',
          },
        });

        console.log(`✅ Created checkout session ${session.id} for user ${userId} - ${credits} credits`);

        res.json({
          sessionId: session.id,
          url: session.url,
        });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Error creating checkout session: " + error.message });
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

      // Handle Checkout Session completion
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        
        if (!userId) {
          console.error('❌ Webhook: No userId in checkout session');
          return res.json({ received: true });
        }
        
        console.log(`📥 Webhook: Received checkout.session.completed for user ${userId}`);
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Metadata:`, session.metadata);
        
        // Get credits from metadata (preferred) or fallback to amount-based logic
        let creditsToAdd = 0;
        
        if (session.metadata?.credits) {
          creditsToAdd = parseInt(session.metadata.credits);
          console.log(`   Credits from metadata: ${creditsToAdd}`);
        } else {
          // Fallback for old Payment Links
          const amount = (session.amount_total || 0) / 100;
          if (amount === 2.99) creditsToAdd = 25;
          else if (amount === 4.99) creditsToAdd = 50;
          else if (amount === 6.99) creditsToAdd = 75;
          else if (amount === 8.99) creditsToAdd = 100;
          else if (amount === 39.99) creditsToAdd = 500;
          console.log(`   Credits from amount ($${amount}): ${creditsToAdd}`);
        }
        
        if (creditsToAdd > 0) {
          try {
            const amount = (session.amount_total || 0) / 100;
            await storage.purchaseCredits(userId, creditsToAdd, amount, session.id);
            console.log(`✅ Webhook: Successfully added ${creditsToAdd} credits to user ${userId}`);
          } catch (error) {
            console.error("❌ Webhook: Error adding credits:", error);
          }
        } else {
          console.warn(`⚠️ Webhook: Could not determine credits for session ${session.id}`);
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

  // Get all listings
  app.get("/api/listings", async (req, res) => {
    try {
      const listings = await storage.getAllListings();
      console.log(`📋 Fetched ${listings.length} listings`);
      res.json(listings);
    } catch (error: any) {
      console.error("❌ Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Search listings with filters
  app.get("/api/listings/search", async (req: any, res) => {
    try {
      const { q, category, condition, priceMin, priceMax, location, distance, sortBy } = req.query;
      
      // Get user's location if authenticated
      let userLocation = null;
      if (req.auth?.userId) {
        const user = await storage.getUserById(req.auth.userId);
        if (user?.locationLatitude && user?.locationLongitude) {
          userLocation = {
            latitude: parseFloat(user.locationLatitude),
            longitude: parseFloat(user.locationLongitude),
          };
        }
      }
      
      const filters = {
        query: q as string,
        category: category as string,
        condition: condition as string,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        location: location as string,
        distance: distance ? parseFloat(distance as string) : undefined,
        userLocation,
        sortBy: (sortBy as 'newest' | 'price-low' | 'price-high' | 'distance') || 'newest',
      };

      console.log('🔍 Searching listings with filters:', filters);
      const listings = await storage.advancedSearch(filters);
      console.log(`📋 Found ${listings.length} listings`);
      res.json(listings);
    } catch (error: any) {
      console.error("❌ Error searching listings:", error);
      res.status(500).json({ message: "Failed to search listings" });
    }
  });

  // Get user's own listings
  app.get("/api/listings/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const listings = await storage.getUserListings(userId);
      console.log(`📋 Fetched ${listings.length} listings for user ${userId}`);
      res.json(listings);
    } catch (error: any) {
      console.error("❌ Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get dashboard stats (MUST be before :id route)
  app.get("/api/listings/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const stats = await storage.getUserListingsStats(userId);
      console.log(`📊 Fetched stats for user ${userId}:`, stats);
      res.json(stats);
    } catch (error: any) {
      console.error("❌ Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get single listing by ID (MUST be after specific routes like /stats)
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getListingWithSeller(id);
      
      if (!result) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("❌ Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  // Get user's listings (for dashboard)
  app.get("/api/user/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const listings = await storage.getUserListings(userId);
      console.log(`📋 Fetched ${listings.length} listings for user ${userId}`);
      res.json(listings);
    } catch (error: any) {
      console.error("❌ Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get public listings for a specific user (for profile page)
  app.get("/api/users/:userId/listings", async (req, res) => {
    try {
      const { userId } = req.params;
      const allListings = await storage.getUserListings(userId);
      // Only return active listings for public view
      const activeListings = allListings.filter(l => l.status === 'active');
      console.log(`📋 Fetched ${activeListings.length} active listings for user ${userId}`);
      res.json(activeListings);
    } catch (error: any) {
      console.error("❌ Error fetching user's public listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Create single listing
  app.post("/api/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { title, description, price, category, condition, location, images } = req.body;

      if (!title || !description || !price || !category || !condition) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log(`Creating single listing for user ${userId}: ${title}`);

      const listing = await storage.createListing({
        userId,
        title,
        description,
        price: String(price),
        category,
        condition,
        location: location || "Local Area",
        images: images || [],
        status: "active",
      });

      console.log(`Listing created successfully: ${listing.id}`);

      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: error.message || "Failed to create listing" });
    }
  });

  // Delete listing
  app.delete("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.userId;

      // First check if the listing exists and belongs to the user
      const listing = await storage.getListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this listing" });
      }

      await storage.deleteListing(id);
      console.log(`🗑️ Listing ${id} deleted by user ${userId}`);
      
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error: any) {
      console.error("❌ Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Update listing status (mark as sold, etc.)
  app.put("/api/listings/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.auth.userId;

      // Check if the listing belongs to the user
      const listing = await storage.getListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this listing" });
      }

      const updatedListing = await storage.updateListingStatus(id, status);
      console.log(`✏️ Listing ${id} status updated to ${status} by user ${userId}`);
      
      res.status(200).json(updatedListing);
    } catch (error: any) {
      console.error("❌ Error updating listing status:", error);
      res.status(500).json({ message: "Failed to update listing status" });
    }
  });

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

  // ======================
  // Messaging Routes
  // ======================

  // Get messages for current user (conversation threads)
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { messages } = await import("@shared/schema");
      const { desc, or } = await import("drizzle-orm");
      
      // Get all messages where user is sender or receiver
      const userMessages = await db.select()
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
        .orderBy(desc(messages.createdAt));
      
      res.json(userMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages for a specific listing conversation
  app.get("/api/messages/listing/:listingId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listingId } = req.params;
      const { messages } = await import("@shared/schema");
      const { desc, and, or } = await import("drizzle-orm");
      
      // Get messages for this listing where user is involved
      const listingMessages = await db.select()
        .from(messages)
        .where(
          and(
            eq(messages.listingId, listingId),
            or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
          )
        )
        .orderBy(desc(messages.createdAt));
      
      res.json(listingMessages);
    } catch (error) {
      console.error("Error fetching listing messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.auth.userId;
      const { listingId, receiverId, content } = req.body;
      
      console.log('📨 Sending message:', { senderId, listingId, receiverId, contentLength: content?.length });
      
      const { messages, listings } = await import("@shared/schema");
      
      if (!listingId || !receiverId || !content) {
        console.error('❌ Missing required fields:', { listingId: !!listingId, receiverId: !!receiverId, content: !!content });
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Verify listing exists
      const listing = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing.length) {
        console.error('❌ Listing not found:', listingId);
        return res.status(404).json({ message: "Listing not found" });
      }
      
      console.log('✅ Listing verified, creating message...');
      
      // Create message
      const newMessage = await db.insert(messages).values({
        listingId,
        senderId,
        receiverId,
        content,
      }).returning();
      
      console.log('✅ Message created successfully:', newMessage[0].id);
      res.json(newMessage[0]);
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      res.status(500).json({ 
        message: "Failed to send message",
        error: error.message,
        code: error.code
      });
    }
  });

  // Mark messages as read
  app.put("/api/messages/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { id } = req.params;
      const { messages } = await import("@shared/schema");
      const { and } = await import("drizzle-orm");
      
      // Only the receiver can mark as read
      await db.update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.id, id),
          eq(messages.receiverId, userId)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // ======================
  // Admin Routes
  // ======================

  // Seed database with sample listings (admin only)
  app.post("/api/admin/seed-listings", isAuthenticated, async (req: any, res) => {
    try {
      const { categories, locations, categoryImages } = await import("./seed-data.js");
      const userId = req.auth.userId;

      console.log("🌱 Starting to seed listings...");

      let totalCreated = 0;
      const createdListings = [];

      // Create listings for each category
      for (const [category, items] of Object.entries(categories)) {
        console.log(`📦 Creating ${items.length} listings for ${category}...`);

        for (const item of items as any[]) {
          const randomLocation = locations[Math.floor(Math.random() * locations.length)];
          const randomImages = categoryImages[category] || [];
          const selectedImages = randomImages.slice(0, Math.min(3, randomImages.length));

          const listing = await storage.createListing({
            userId,
            title: item.title,
            description: item.description,
            price: item.price,
            category: category,
            condition: item.condition,
            location: randomLocation,
            images: selectedImages,
            status: "active",
          });

          createdListings.push(listing);
          totalCreated++;
        }
      }

      console.log(`✅ Successfully created ${totalCreated} sample listings!`);

      res.json({
        success: true,
        message: `Successfully created ${totalCreated} sample listings`,
        totalCreated,
        breakdown: Object.fromEntries(
          Object.entries(categories).map(([cat, items]) => [cat, (items as any[]).length])
        ),
      });
    } catch (error: any) {
      console.error("❌ Error seeding database:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to seed database",
        error: error.message 
      });
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
