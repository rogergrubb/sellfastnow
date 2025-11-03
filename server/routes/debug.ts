import { Router } from "express";
import { db } from "../storage";
import { listings, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * Debug endpoint to check listing ownership
 * GET /api/debug/listing/:id
 */
router.get("/listing/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.auth.userId;

    // Get the listing with seller info
    const result = await db
      .select({
        listing: listings,
        seller: users,
      })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, id));

    if (result.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const { listing, seller } = result[0];

    // Return debug info
    res.json({
      listingId: listing.id,
      listingTitle: listing.title,
      listingUserId: listing.userId,
      sellerInfo: {
        id: seller.id,
        username: seller.username,
        email: seller.email,
      },
      currentUser: {
        id: currentUserId,
      },
      isOwnListing: currentUserId === seller.id,
      userIdMatch: currentUserId === listing.userId,
      sellerIdMatch: seller.id === listing.userId,
    });
  } catch (error: any) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({ message: "Failed to fetch debug info", error: error.message });
  }
});

/**
 * Debug endpoint to check current user
 * GET /api/debug/me
 */
router.get("/me", isAuthenticated, async (req: any, res) => {
  try {
    const currentUserId = req.auth.userId;

    // Get current user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's listings
    const userListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        status: listings.status,
      })
      .from(listings)
      .where(eq(listings.userId, currentUserId));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      listings: userListings,
      listingCount: userListings.length,
    });
  } catch (error: any) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({ message: "Failed to fetch user info", error: error.message });
  }
});

export default router;
