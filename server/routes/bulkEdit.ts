import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { db } from "../db";
import { listings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * Update listing with rotation and other edits
 * PATCH /api/bulk-edit/listings/:id
 */
router.patch("/listings/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    const updates = req.body;

    // Verify ownership
    const listing = await db.query.listings.findFirst({
      where: and(
        eq(listings.id, id),
        eq(listings.userId, userId)
      ),
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found or unauthorized" });
    }

    // Image rotations are stored directly in the imageRotations field
    // No special handling needed

    // Update listing
    const [updatedListing] = await db
      .update(listings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id))
      .returning();

    res.json(updatedListing);
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

/**
 * Get listings for bulk editing
 * GET /api/bulk-edit/listings
 */
router.get("/listings", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    const userListings = await db.query.listings.findMany({
      where: eq(listings.userId, userId),
      orderBy: (listings, { desc }) => [desc(listings.createdAt)],
    });

    res.json(userListings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

export default router;

