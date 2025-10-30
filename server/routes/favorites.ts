import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { db } from "../db";
import { favorites } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

/**
 * GET /api/favorites/:listingId
 * Check if a listing is favorited by the current user
 */
router.get("/:listingId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { listingId } = req.params;

    const favorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        )
      )
      .limit(1);

    res.json({ isFavorited: favorite.length > 0 });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Failed to check favorite status" });
  }
});

/**
 * POST /api/favorites/toggle
 * Toggle favorite status for a listing
 */
router.post("/toggle", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: "Listing ID is required" });
    }

    // Check if already favorited
    const existingFavorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        )
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // Remove from favorites
      await db.delete(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.listingId, listingId)
          )
        );
      console.log(`💔 User ${userId} unfavorited listing ${listingId}`);
      res.json({ isFavorited: false });
    } else {
      // Add to favorites
      await db.insert(favorites).values({
        userId,
        listingId,
      });
      console.log(`❤️ User ${userId} favorited listing ${listingId}`);
      
      // Send SMS notification to seller
      (async () => {
        try {
          const { sendItemFavoritedSMS } = await import("../services/smsNotifications");
          const { listings, users } = await import("@shared/schema");
          
          const listing = await db.query.listings.findFirst({
            where: eq(listings.id, listingId),
          });
          
          const buyer = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });
          
          if (listing && buyer) {
            const buyerName = `${buyer.firstName} ${buyer.lastName}`;
            const listingUrl = `https://sellfast.now/listings/${listingId}`;
            await sendItemFavoritedSMS(listing.userId, buyerName, listing.title, listingUrl);
          }
        } catch (error) {
          console.error('Error sending favorite SMS:', error);
        }
      })();
      
      res.json({ isFavorited: true });
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
});

/**
 * GET /api/favorites
 * Get all favorites for the current user
 */
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    const userFavorites = await db.select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    res.json(userFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
});

export default router;

