import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";

const router = Router();

  // Get all listings
  router.get("/", async (req, res) => {
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
  router.get("/search", async (req: any, res) => {
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
  router.get("/mine", isAuthenticated, async (req: any, res) => {
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
  router.get("/stats", isAuthenticated, async (req: any, res) => {
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
  router.get("/:id", async (req, res) => {
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
  router.get("/user/listings", isAuthenticated, async (req: any, res) => {
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
  router.get("/users/:userId/listings", async (req, res) => {
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
  router.post("/", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { title, description, price, category, condition, location, images, status } = req.body;

      if (!title || !description || !price || !category || !condition) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log(`Creating single listing for user ${userId}: ${title} with status: ${status || 'active'}`);

      const listing = await storage.createListing({
        userId,
        title,
        description,
        price: String(price),
        category,
        condition,
        location: location || "Local Area",
        images: images || [],
        status: status || "active",  // Use provided status or default to active
      });

      console.log(`Listing created successfully: ${listing.id}`);

      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: error.message || "Failed to create listing" });
    }
  });

  // Delete listing
  router.delete("/:id", isAuthenticated, async (req: any, res) => {
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

  // Update listing (full update)
  router.put("/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.userId;
      const updateData = req.body;

      // Check if the listing belongs to the user
      const listing = await storage.getListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this listing" });
      }

      // Update the listing
      const updatedListing = await storage.updateListing(id, updateData);
      console.log(`✏️ Listing ${id} updated by user ${userId}`);
      
      res.status(200).json(updatedListing);
    } catch (error: any) {
      console.error("❌ Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Update listing status (mark as sold, etc.)
  router.put("/:id/status", isAuthenticated, async (req: any, res) => {
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
  router.post("/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const { listings: listingsData, status: batchStatus } = req.body;

      if (!listingsData || !Array.isArray(listingsData)) {
        return res.status(400).json({ message: "listings array is required" });
      }

      // Default to active if not specified
      const targetStatus = batchStatus || "active";
      const isDraft = targetStatus === "draft";

      console.log(`📦 Batch creating ${listingsData.length} listings as ${targetStatus} for user ${userId}`);

      const createdListings = [];
      const errors = [];

      for (let i = 0; i < listingsData.length; i++) {
        try {
          const listingData = listingsData[i];
          
          // Validate required fields (more lenient for drafts)
          if (!isDraft) {
            // Strict validation for active listings
            if (!listingData.title || !listingData.description || !listingData.price || 
                !listingData.category || !listingData.condition) {
              errors.push({ index: i, error: "Missing required fields" });
              continue;
            }
          } else {
            // Lenient validation for drafts - only require at least a title or description
            if (!listingData.title && !listingData.description) {
              errors.push({ index: i, error: "At least title or description is required" });
              continue;
            }
          }

          const listing = await storage.createListing({
            userId,
            title: listingData.title || "Untitled",
            description: listingData.description || "",
            price: String(listingData.price || 0),
            category: listingData.category || "Other",
            condition: listingData.condition || "good",
            location: listingData.location || "Local Area",
            images: listingData.images || [],
            status: targetStatus,
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

export default router;
