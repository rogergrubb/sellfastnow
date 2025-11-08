import { Router } from "express";
import { db } from "../db";
import { listings } from "@shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import Stripe from "stripe";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

/**
 * GET /api/featured-listings
 * Returns active featured listings for homepage carousel
 */
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    
    // Get active featured listings (featured_until > NOW())
    const featuredListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        images: listings.images,
        location: listings.location,
        featuredUntil: listings.featuredUntil,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(
        and(
          eq(listings.status, "active"),
          gt(listings.featuredUntil, now)
        )
      )
      .orderBy(sql`RANDOM()`) // Random order for variety
      .limit(12);

    // Extract primary image from images array
    const formattedListings = featuredListings.map((listing) => ({
      ...listing,
      primaryImage: listing.images && listing.images.length > 0 ? listing.images[0] : null,
    }));

    res.json(formattedListings);
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    res.status(500).json({ message: "Failed to fetch featured listings" });
  }
});

/**
 * POST /api/featured-listings/:id/feature
 * Create a Stripe PaymentIntent to feature a listing
 */
router.post("/:id/feature", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body as { duration: "24h" | "48h" | "7d" };
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate duration
    if (!["24h", "48h", "7d"].includes(duration)) {
      return res.status(400).json({ message: "Invalid duration. Must be 24h, 48h, or 7d" });
    }

    // Get the listing
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Verify ownership
    if (listing.userId !== userId) {
      return res.status(403).json({ message: "You can only feature your own listings" });
    }

    // Verify listing is active
    if (listing.status !== "active") {
      return res.status(400).json({ message: "Only active listings can be featured" });
    }

    // Calculate price based on duration
    const prices: Record<string, number> = {
      "24h": 500, // $5.00 in cents
      "48h": 1000, // $10.00 in cents
      "7d": 2500, // $25.00 in cents
    };

    const amount = prices[duration];

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        listing_id: id,
        duration,
        feature_type: "homepage_carousel",
        user_id: userId,
      },
      description: `Feature listing: ${listing.title} for ${duration}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      duration,
    });
  } catch (error) {
    console.error("Error creating feature payment:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

/**
 * GET /api/featured-listings/:id/status
 * Check if a listing is currently featured
 */
router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const [listing] = await db
      .select({
        id: listings.id,
        featuredUntil: listings.featuredUntil,
        featuredDuration: listings.featuredDuration,
        featuredCreatedAt: listings.featuredCreatedAt,
      })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const isFeatured = listing.featuredUntil && new Date(listing.featuredUntil) > now;

    res.json({
      isFeatured,
      featuredUntil: listing.featuredUntil,
      featuredDuration: listing.featuredDuration,
      featuredCreatedAt: listing.featuredCreatedAt,
    });
  } catch (error) {
    console.error("Error checking featured status:", error);
    res.status(500).json({ message: "Failed to check featured status" });
  }
});

export default router;
