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
import { eq, and, or, desc, sql } from "drizzle-orm";
import { transactions as transactionsTable, listings, users } from "@shared/schema";
import transactionRoutes from "./routes/transactions";
import reviewRoutes from "./routes/reviews";
import reputationRoutes from "./routes/reputation";
import stripeConnectRoutes from "./routes/stripe-connect";
import paymentSessionRoutes from "./routes/payment-sessions";
import { registerSharesRoutes } from "./routes/shares";
import conversationRoutes from "./routes/conversations";
import messageReadRoutes from "./routes/message-read";
import messageSearchRoutes from "./routes/message-search";
import emailVerificationRoutes from "./routes/email-verification";
import phoneVerificationRoutes from "./routes/phone-verification";
import locationRoutes from "./routes/location";
import favoritesRoutes from "./routes/favorites";
import aiRoutes from "./routes/ai";
import listingsRoutes from "./routes/listings";
import imagesRoutes from "./routes/images";
import collectionsRoutes from "./routes/collections";
import draftFoldersRoutes from "./routes/draft-folders";
import meetupRoutes from "./routes/meetup";
import reliabilityRoutes from "./routes/reliability";
import notificationsRoutes from "./routes/notifications";
import boostsRoutes from "./routes/boosts";
import savedSearchesRoutes from "./routes/savedSearches";
import offersRoutes from "./routes/offers";
import paymentRoutes from "./routes/payments";
import welcomeRoutes from "./routes/welcome";
import { stripe } from "./stripe";
import { STRIPE_CONFIG, calculatePlatformFee, getBaseUrl } from "./config/stripe.config";
import { 
  stripePaymentIntentLimiter,
  stripeCheckoutSessionLimiter,
  messageSendLimiter,
} from "./middleware/rateLimiter";
import { validateMessage } from "./utils/messageValidation";
import { getWebSocketService } from "./services/websocketService";

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
  // TEMPORARY: Manual Migration Endpoint
  // ======================
  app.get('/api/run-migrations-now', async (req, res) => {
    try {
      console.log('🔧 Running manual migrations...');
      
      // Add image_rotations column to listings
      await db.execute(sql`
        ALTER TABLE listings 
        ADD COLUMN IF NOT EXISTS image_rotations JSONB DEFAULT '[]'::jsonb;
      `);
      console.log('✅ Added image_rotations column');
      
      // Add free_listings_used_this_month column to users
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS free_listings_used_this_month INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('✅ Added free_listings_used_this_month column');
      
      // Add free_listings_reset_date column to users
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS free_listings_reset_date TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      console.log('✅ Added free_listings_reset_date column');
      
      res.json({ 
        success: true, 
        message: 'Migrations completed successfully!',
        columns_added: [
          'listings.image_rotations',
          'users.free_listings_used_this_month',
          'users.free_listings_reset_date'
        ]
      });
    } catch (error) {
      console.error('❌ Migration failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Migration failed', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
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

  // Get free listings remaining for current user
  app.get('/api/auth/free-listings-remaining', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if columns exist (migration may not have run yet)
      const now = new Date();
      const resetDate = user.freeListingsResetDate ? new Date(user.freeListingsResetDate) : now;
      const daysSinceReset = (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24);
      
      let freeListingsUsed = user.freeListingsUsedThisMonth || 0;
      
      // Reset counter if it's been more than 30 days
      if (daysSinceReset >= 30 && user.freeListingsResetDate) {
        freeListingsUsed = 0;
        // Only update if columns exist
        try {
          await db.update(users)
            .set({ 
              freeListingsUsedThisMonth: 0,
              freeListingsResetDate: now
            })
            .where(eq(users.id, userId));
        } catch (error) {
          console.error("Error updating free listings counter:", error);
          // Continue anyway - columns may not exist yet
        }
      }
      
      const freeListingsRemaining = Math.max(0, 5 - freeListingsUsed);
      
      res.json({
        freeListingsRemaining,
        freeListingsUsed,
        resetDate: resetDate.toISOString(),
        nextResetDate: new Date(resetDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error("Error fetching free listings:", error);
      res.status(500).json({ message: "Failed to fetch free listings data" });
    }
  });

  // ======================
  // Transaction Routes (NEW - ENABLED)
  // ======================
  app.use("/api/transactions", transactionRoutes);
  
  // ======================
  // Social Shares Routes
  // ======================
  registerSharesRoutes(app);
  
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
  // Verification Routes
  // ======================
  app.use("/api/verification", emailVerificationRoutes);
  app.use("/api/verification", phoneVerificationRoutes);

  // ======================
  // Reputation Routes
  // ======================
  app.use("/api/reputation", reputationRoutes);

  // ======================
  // Conversation Routes
  // ======================
  app.use("/api/conversations", conversationRoutes);

  // ======================
  // Message Read Routes
  // ======================
  app.use("/api/messages", messageReadRoutes);

  // ======================
  // Message Search Routes
  // ======================
  app.use("/api/messages", messageSearchRoutes);

  // ======================
  // Location Routes
  // ======================
  app.use("/api/location", locationRoutes);

  // ======================
  // Favorites Routes
  // ======================
  app.use("/api/favorites", favoritesRoutes);

  // ======================
  // AI Routes
  // ======================
  app.use("/api/ai", aiRoutes);

  // ======================
  // Draft Folders Routes
  // ======================
  app.use("/api/draft-folders", draftFoldersRoutes);

  // ======================
  // Meetup Routes
  // ======================
  app.use("/api/meetups", meetupRoutes);

  // ======================
  // Reliability Routes
  // ======================
  app.use("/api/reliability", reliabilityRoutes);

  // ======================
  // Notifications Routes
  // ======================
  app.use("/api/notifications", notificationsRoutes);

  // ======================
  // Boosts Routes
  // ======================
  app.use("/api/boosts", boostsRoutes);

  // ======================
  // Saved Searches Routes
  // ======================
  app.use("/api/saved-searches", savedSearchesRoutes);

  // ======================
  // Welcome Modal Routes
  // ======================
  app.use("/api", welcomeRoutes);

  // ======================
  // Listings Routes
  // ======================
  app.use("/api/listings", listingsRoutes);
  
  // ======================
  // Offers Routes
  // ======================
  app.use("/api/listings", offersRoutes); // For /listings/:id/offers
  app.use("/api/offers", offersRoutes); // For /offers/made, /offers/received, /offers/:id
  app.use("/api/payments", paymentRoutes); // For /payments/transactions/:id/payment-intent

  // ======================
  // Images & Upload Routes
  // ======================
  app.use("/api/images", imagesRoutes);
  app.use("/api", imagesRoutes); // For /upload-session routes

  // ======================
  // Collections & AI Suggestions Routes
  // ======================
  app.use("/api/collections", collectionsRoutes);
  app.use("/api", collectionsRoutes); // For /drafts/save, /ai/suggestCollections, /monetization routes

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
      console.error("Error syncing email verification:", error);
      res.status(500).json({ message: "Failed to sync email verification" });
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

  // Stripe routes are now using the centralized stripe client imported at the top
  // Create payment intent for listing promotion or premium features
  app.post("/api/create-payment-intent", isAuthenticated, stripePaymentIntentLimiter, async (req, res) => {
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
        }, {
          idempotencyKey: `payment_${(req as any).auth.userId}_${Date.now()}`,
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Stripe payment intent error:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

  // Create Checkout Session for credit purchases
  app.post("/api/create-checkout-session", isAuthenticated, stripeCheckoutSessionLimiter, async (req: any, res) => {
      try {
        const userId = req.auth.userId;
        const { credits } = req.body;

        if (!credits || credits <= 0) {
          return res.status(400).json({ message: "Invalid credit amount" });
        }

        // Use centralized credit bundles configuration
        const bundle = STRIPE_CONFIG.CREDIT_BUNDLES[credits];
        if (!bundle) {
          return res.status(400).json({ message: "Invalid credit bundle" });
        }

        // Get user email for prefilling
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Use centralized base URL configuration
        const baseUrl = getBaseUrl();

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
        }, {
          idempotencyKey: `checkout_${userId}_${credits}_${Date.now()}`,
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
        const { userId, type, credits, listingId, boostType } = paymentIntent.metadata;

        if (type === 'ai_credits' && userId && credits) {
          try {
            await storage.addAICredits(userId, parseInt(credits));
            console.log(`Added ${credits} AI credits to user ${userId}`);
          } catch (error) {
            console.error("Error adding AI credits:", error);
          }
        }

        // Handle boost payment
        if (listingId && boostType && userId) {
          try {
            const { promotedListings } = await import("@shared/schema");
            
            // Find the pending boost
            const [boost] = await db
              .select()
              .from(promotedListings)
              .where(eq(promotedListings.stripePaymentIntentId, paymentIntent.id))
              .limit(1);

            if (boost) {
              // Activate the boost
              await db
                .update(promotedListings)
                .set({
                  status: "active",
                  startedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(promotedListings.id, boost.id));

              console.log(`✅ Activated boost ${boost.id} for listing ${listingId}`);
            }
          } catch (error) {
            console.error("Error activating boost:", error);
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

  // ======================
  // Escrow Deposit Routes
  // ======================
  // Using centralized stripe client

  /**
   * Submit deposit - Buyer submits deposit for a listing
     * Creates Stripe PaymentIntent with manual capture
     * POST /api/deposits/submit
     * Body: { listingId, amount, latitude?, longitude? }
     */
    app.post("/api/deposits/submit", isAuthenticated, async (req: any, res) => {
      try {
        const buyerId = req.auth.userId;
        const { listingId, amount, latitude, longitude } = req.body;

        if (!listingId || !amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid listing ID or amount" });
        }

        // Get listing and seller info
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, listingId),
        });

        if (!listing) {
          return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.userId === buyerId) {
          return res.status(400).json({ message: "You cannot buy your own listing" });
        }

        // Get seller's Stripe account
        const seller = await db.query.users.findFirst({
          where: eq(users.id, listing.userId),
        });

        if (!seller || !seller.stripeAccountId) {
          return res.status(400).json({ 
            message: "Seller hasn't set up payment processing yet",
            needsStripeSetup: true 
          });
        }

        // Get buyer's Stripe customer ID or create one
        const buyer = await db.query.users.findFirst({
          where: eq(users.id, buyerId),
        });

        let stripeCustomerId = buyer?.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: buyer?.email,
            metadata: { userId: buyerId },
          });
          stripeCustomerId = customer.id;
          
          // Update user with Stripe customer ID
          await db.update(users)
            .set({ stripeCustomerId })
            .where(eq(users.id, buyerId));
        }

        // Calculate platform fee using centralized config
        const platformFee = calculatePlatformFee(amount);
        const sellerPayout = amount - platformFee;

        // Create Stripe PaymentIntent with manual capture (authorize only)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          customer: stripeCustomerId,
          capture_method: "manual", // Don't capture yet - wait for seller acceptance
          payment_method_types: ["card"],
          application_fee_amount: Math.round(platformFee * 100),
          transfer_data: {
            destination: seller.stripeAccountId,
          },
          metadata: {
            buyerId,
            sellerId: listing.userId,
            listingId,
            type: "escrow_deposit",
          },
          description: `Deposit for ${listing.title}`,
        });

        // Create transaction record
        const [transaction] = await db.insert(transactions).values({
          buyerId,
          sellerId: listing.userId,
          listingId,
          amount: amount.toString(),
          depositAmount: amount.toString(),
          platformFee: platformFee.toString(),
          sellerPayout: sellerPayout.toString(),
          stripePaymentIntentId: paymentIntent.id,
          status: "deposit_submitted",
          depositSubmittedAt: new Date(),
          depositBuyerLatitude: latitude?.toString(),
          depositBuyerLongitude: longitude?.toString(),
        }).returning();

        // TODO: Send notification to seller about deposit submission

        res.json({
          success: true,
          transactionId: transaction.id,
          clientSecret: paymentIntent.client_secret,
          message: "Deposit submitted successfully. Waiting for seller acceptance.",
        });
      } catch (error: any) {
        console.error("Error submitting deposit:", error);
        res.status(500).json({ message: "Error submitting deposit: " + error.message });
      }
    });

    /**
     * Accept deposit - Seller accepts the deposit
     * Captures the Stripe PaymentIntent (moves funds to escrow)
     * POST /api/deposits/:transactionId/accept
     * Body: { latitude?, longitude? }
     */
    app.post("/api/deposits/:transactionId/accept", isAuthenticated, async (req: any, res) => {
      try {
        const sellerId = req.auth.userId;
        const { transactionId } = req.params;
        const { latitude, longitude } = req.body;

        // Get transaction
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactionsTable.id, transactionId),
        });

        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.sellerId !== sellerId) {
          return res.status(403).json({ message: "You are not the seller for this transaction" });
        }

        if (transaction.status !== "deposit_submitted") {
          return res.status(400).json({ 
            message: `Cannot accept deposit. Current status: ${transaction.status}` 
          });
        }

        if (!transaction.stripePaymentIntentId) {
          return res.status(400).json({ message: "No payment intent found" });
        }

        // Capture the payment (move funds to platform escrow)
        const paymentIntent = await stripe.paymentIntents.capture(
          transaction.stripePaymentIntentId
        );

        // Update transaction
        const [updatedTransaction] = await db.update(transactions)
          .set({
            status: "deposit_accepted",
            depositAcceptedAt: new Date(),
            depositSellerLatitude: latitude?.toString(),
            depositSellerLongitude: longitude?.toString(),
            stripeChargeId: paymentIntent.latest_charge as string,
          })
          .where(eq(transactionsTable.id, transactionId))
          .returning();

        // TODO: Send notification to buyer that deposit was accepted

        res.json({
          success: true,
          transaction: updatedTransaction,
          message: "Deposit accepted. Funds are now in escrow.",
        });
      } catch (error: any) {
        console.error("Error accepting deposit:", error);
        res.status(500).json({ message: "Error accepting deposit: " + error.message });
      }
    });

    /**
     * Reject deposit - Seller rejects the deposit
     * Cancels the Stripe PaymentIntent (releases authorization)
     * POST /api/deposits/:transactionId/reject
     * Body: { reason? }
     */
    app.post("/api/deposits/:transactionId/reject", isAuthenticated, async (req: any, res) => {
      try {
        const sellerId = req.auth.userId;
        const { transactionId } = req.params;
        const { reason } = req.body;

        // Get transaction
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactionsTable.id, transactionId),
        });

        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.sellerId !== sellerId) {
          return res.status(403).json({ message: "You are not the seller for this transaction" });
        }

        if (transaction.status !== "deposit_submitted") {
          return res.status(400).json({ 
            message: `Cannot reject deposit. Current status: ${transaction.status}` 
          });
        }

        if (!transaction.stripePaymentIntentId) {
          return res.status(400).json({ message: "No payment intent found" });
        }

        // Cancel the payment intent (release authorization)
        await stripe.paymentIntents.cancel(transaction.stripePaymentIntentId);

        // Update transaction
        const [updatedTransaction] = await db.update(transactions)
          .set({
            status: "deposit_rejected",
            depositRejectedAt: new Date(),
            depositRejectionReason: reason,
          })
          .where(eq(transactionsTable.id, transactionId))
          .returning();

        // TODO: Send notification to buyer that deposit was rejected

        res.json({
          success: true,
          transaction: updatedTransaction,
          message: "Deposit rejected. Authorization released.",
        });
      } catch (error: any) {
        console.error("Error rejecting deposit:", error);
        res.status(500).json({ message: "Error rejecting deposit: " + error.message });
      }
    });

    /**
     * Complete transaction - Buyer confirms item is as described
     * Transfers funds from escrow to seller
     * POST /api/transactions/:transactionId/complete
     * Body: { latitude?, longitude? }
     */
    app.post("/api/transactions/:transactionId/complete", isAuthenticated, async (req: any, res) => {
      try {
        const buyerId = req.auth.userId;
        const { transactionId } = req.params;
        const { latitude, longitude } = req.body;

        // Get transaction
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactionsTable.id, transactionId),
        });

        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.buyerId !== buyerId) {
          return res.status(403).json({ message: "You are not the buyer for this transaction" });
        }

        if (transaction.status !== "deposit_accepted" && transaction.status !== "in_escrow") {
          return res.status(400).json({ 
            message: `Cannot complete transaction. Current status: ${transaction.status}` 
          });
        }

        if (!transaction.stripePaymentIntentId) {
          return res.status(400).json({ message: "No payment intent found" });
        }

        // Get seller info
        const seller = await db.query.users.findFirst({
          where: eq(users.id, transaction.sellerId),
        });

        if (!seller || !seller.stripeAccountId) {
          return res.status(400).json({ message: "Seller account not found" });
        }

        // Transfer funds to seller (already configured in PaymentIntent)
        // The transfer happens automatically because we used transfer_data in PaymentIntent
        // But we can create an explicit transfer for better tracking
        const transferAmount = Math.round(parseFloat(transaction.sellerPayout) * 100);
        const transfer = await stripe.transfers.create({
          amount: transferAmount,
          currency: "usd",
          destination: seller.stripeAccountId,
          transfer_group: transactionId,
          metadata: {
            transactionId,
            buyerId,
            sellerId: transaction.sellerId,
            listingId: transaction.listingId,
          },
          description: `Payment for transaction ${transactionId}`,
        });

        // Update transaction
        const [updatedTransaction] = await db.update(transactions)
          .set({
            status: "completed",
            completedAt: new Date(),
            completionBuyerLatitude: latitude?.toString(),
            completionBuyerLongitude: longitude?.toString(),
            stripeTransferId: transfer.id,
          })
          .where(eq(transactionsTable.id, transactionId))
          .returning();

        // TODO: Send notifications to both parties
        // TODO: Update listing status to sold
        // TODO: Trigger reputation/review system

        res.json({
          success: true,
          transaction: updatedTransaction,
          message: "Transaction completed! Funds transferred to seller.",
        });
      } catch (error: any) {
        console.error("Error completing transaction:", error);
        res.status(500).json({ message: "Error completing transaction: " + error.message });
      }
    });

    /**
     * Refund transaction - Buyer cancels because item is not as described
     * Instantly refunds money to buyer
     * POST /api/transactions/:transactionId/refund
     * Body: { reason?, latitude?, longitude? }
     */
    app.post("/api/transactions/:transactionId/refund", isAuthenticated, async (req: any, res) => {
      try {
        const buyerId = req.auth.userId;
        const { transactionId } = req.params;
        const { reason, latitude, longitude } = req.body;

        // Get transaction
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactionsTable.id, transactionId),
        });

        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.buyerId !== buyerId) {
          return res.status(403).json({ message: "You are not the buyer for this transaction" });
        }

        if (transaction.status !== "deposit_accepted" && transaction.status !== "in_escrow") {
          return res.status(400).json({ 
            message: `Cannot refund transaction. Current status: ${transaction.status}` 
          });
        }

        if (!transaction.stripePaymentIntentId) {
          return res.status(400).json({ message: "No payment intent found" });
        }

        // Create instant refund
        const refund = await stripe.refunds.create({
          payment_intent: transaction.stripePaymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            transactionId,
            buyerId,
            sellerId: transaction.sellerId,
            refundReason: reason || "Item not as described",
          },
        });

        // Update transaction
        const [updatedTransaction] = await db.update(transactions)
          .set({
            status: "refunded",
            cancelledAt: new Date(),
            cancelledBy: buyerId,
            cancellationReason: reason || "Item not as described",
            completionBuyerLatitude: latitude?.toString(),
            completionBuyerLongitude: longitude?.toString(),
            stripeRefundId: refund.id,
          })
          .where(eq(transactionsTable.id, transactionId))
          .returning();

        // TODO: Send notifications to both parties
        // TODO: Update listing status back to available

        res.json({
          success: true,
          transaction: updatedTransaction,
          refund,
          message: "Refund processed instantly. Funds will appear in your account within 2-7 business days.",
        });
      } catch (error: any) {
        console.error("Error processing refund:", error);
        res.status(500).json({ message: "Error processing refund: " + error.message });
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

  // ======================
  // Credit System Routes
  // ======================

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
      res.status(500).json({ message: "Failed to use credits" });
    }
  });

  // ======================
  // Messaging Routes
  // ======================

  // Get messages for current user (conversation threads) with pagination
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { messages } = await import("@shared/schema");
      const { desc, or, count } = await import("drizzle-orm");
      
      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
      
      const total = totalResult.count;
      
      // Get paginated messages
      const userMessages = await db.select()
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json({
        messages: userMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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

  // Send a message with validation and rate limiting
  app.post("/api/messages", isAuthenticated, messageSendLimiter, async (req: any, res) => {
    try {
      const senderId = req.auth.userId;
      const { listingId, receiverId, content } = req.body;
      
      console.log('📨 Sending message:', { senderId, listingId, receiverId, contentLength: content?.length });
      
      // Comprehensive validation using utility function
      const validation = await validateMessage(senderId, receiverId, listingId, content);
      if (!validation.valid) {
        console.error('❌ Message validation failed:', validation.error);
        return res.status(400).json({ message: validation.error });
      }
      
      const { messages } = await import("@shared/schema");
      
      console.log('✅ Message validated, creating message...');
      
      // Create message with trimmed content
      const newMessage = await db.insert(messages).values({
        listingId,
        senderId,
        receiverId,
        content: content.trim(),
      }).returning();
      
      console.log('✅ Message created successfully:', newMessage[0].id);
      
      // Broadcast message via WebSocket for real-time delivery
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastMessage(newMessage[0]);
        console.log('📡 Message broadcasted via WebSocket');
        
        // Emit notification popup to receiver
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, listingId),
        });
        
        const sender = await db.query.users.findFirst({
          where: eq(users.id, senderId),
        });
        
        if (listing && sender) {
          wsService.emitToUser(receiverId, 'new_message', {
            id: newMessage[0].id,
            listingId,
            listingTitle: listing.title,
            listingImage: listing.images ? JSON.parse(listing.images)[0] : undefined,
            senderName: `${sender.firstName} ${sender.lastName}`,
            message: content.trim(),
            timestamp: newMessage[0].createdAt,
          });
          console.log('🔔 Notification sent to receiver');
        }
      }
      
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
