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
import { insertListingSchema, insertMessageSchema, insertFavoriteSchema } from "@shared/schema";

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

  // Get single listing
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
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

  // Check if listing is favorited
  app.get("/api/favorites/:listingId", isAuthenticated, async (req: any, res) => {
    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
