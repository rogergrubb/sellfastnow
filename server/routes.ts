// Comprehensive API routes for SellFast.Now marketplace
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertListingSchema,
  insertMessageSchema,
  insertFavoriteSchema,
  insertReviewSchema,
  insertReviewVoteSchema,
  insertCancellationCommentSchema,
  insertCancellationCommentVoteSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // ======================
  // Authentication Routes
  // ======================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  // Update listing
  app.put("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
  // Image Upload Routes (Object Storage)
  // ======================

  // Get upload URL for images
  app.post("/api/images/upload", isAuthenticated, async (_req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Set ACL policy for uploaded image
  app.post("/api/images/set-policy", isAuthenticated, async (req: any, res) => {
    try {
      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ message: "imageURL is required" });
      }

      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          visibility: "public",
        }
      );

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting image policy:", error);
      res.status(500).json({ message: "Failed to set image policy" });
    }
  });

  // Serve protected images
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const senderId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        return res.json({ isFavorited: false });
      }
      
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
  }

  // ======================
  // Review Routes
  // ======================

  // Create a review
  app.post("/api/reviews/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId,
      });

      const review = await storage.createReview(validatedData);
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
      const role = req.query.role as string | undefined;
      const sort = req.query.sort as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const reviews = await storage.getUserReviews(userId, role, sort, limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Respond to a review
  app.post("/api/reviews/:reviewId/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reviewId } = req.params;
      const { responseText } = req.body;

      if (!responseText) {
        return res.status(400).json({ message: "Response text is required" });
      }

      const review = await storage.respondToReview(reviewId, userId, responseText);
      res.json(review);
    } catch (error: any) {
      console.error("Error responding to review:", error);
      res.status(400).json({ message: error.message || "Failed to respond to review" });
    }
  });

  // Vote on a review
  app.post("/api/reviews/:reviewId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Create cancellation comment
  app.post("/api/cancellations/:listingId/comment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId } = req.params;
      
      const validatedData = insertCancellationCommentSchema.parse({
        ...req.body,
        listingId,
        cancelledByUserId: userId,
      });

      const comment = await storage.createCancellationComment(validatedData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to create cancellation comment" });
    }
  });

  // Respond to cancellation comment
  app.post("/api/cancellations/:commentId/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      const { responseText } = req.body;

      if (!responseText) {
        return res.status(400).json({ message: "Response text is required" });
      }

      const comment = await storage.respondToCancellationComment(commentId, userId, responseText);
      res.json(comment);
    } catch (error: any) {
      console.error("Error responding to cancellation comment:", error);
      res.status(400).json({ message: error.message || "Failed to respond to cancellation comment" });
    }
  });

  // Vote on cancellation comment
  app.post("/api/cancellations/:commentId/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get("/api/transactions/:listingId/details", async (req, res) => {
    try {
      const { listingId } = req.params;
      const details = await storage.getTransactionDetails(listingId);
      if (!details) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(details);
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      res.status(500).json({ message: "Failed to fetch transaction details" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
