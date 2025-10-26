import express from "express";
import { db } from "../db";
import { promotedListings, promotedListingAnalytics, listings } from "../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { stripe } from "../stripe";

const router = express.Router();

// Boost pricing configuration
const BOOST_PRICES = {
  "3_day_boost": { amount: 500, days: 3, label: "3-Day Boost" }, // $5.00
  "7_day_boost": { amount: 1000, days: 7, label: "7-Day Boost" }, // $10.00
  "30_day_boost": { amount: 3000, days: 30, label: "30-Day Boost" }, // $30.00
};

// POST /api/boosts - Create a new boost and Stripe payment intent
router.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { listingId, boostType } = req.body;

    // Validate boost type
    if (!BOOST_PRICES[boostType as keyof typeof BOOST_PRICES]) {
      return res.status(400).json({ error: "Invalid boost type" });
    }

    const boostConfig = BOOST_PRICES[boostType as keyof typeof BOOST_PRICES];

    // Verify listing exists and belongs to user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only boost your own listings" });
    }

    // Check if listing already has an active boost
    const existingBoost = await db.query.promotedListings.findFirst({
      where: and(
        eq(promotedListings.listingId, listingId),
        eq(promotedListings.status, "active")
      ),
    });

    if (existingBoost) {
      return res.status(400).json({ error: "This listing is already boosted" });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: boostConfig.amount,
      currency: "usd",
      metadata: {
        listingId,
        boostType,
        userId: req.user.id,
      },
      description: `${boostConfig.label} for listing: ${listing.title}`,
    });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + boostConfig.days);

    // Create promoted listing record
    const [promotedListing] = await db
      .insert(promotedListings)
      .values({
        listingId,
        userId: req.user.id,
        boostType,
        status: "pending_payment",
        stripePaymentIntentId: paymentIntent.id,
        expiresAt,
      })
      .returning();

    res.json({
      promotedListingId: promotedListing.id,
      clientSecret: paymentIntent.client_secret,
      amount: boostConfig.amount,
      boostType: boostConfig.label,
    });
  } catch (error) {
    console.error("Error creating boost:", error);
    res.status(500).json({ error: "Failed to create boost" });
  }
});

// GET /api/boosts/:listingId - Get boost status for a listing
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    const boost = await db.query.promotedListings.findFirst({
      where: eq(promotedListings.listingId, listingId),
      orderBy: [desc(promotedListings.createdAt)],
    });

    if (!boost) {
      return res.json({ hasBoost: false });
    }

    // Check if boost is expired
    const now = new Date();
    const isExpired = boost.status === "active" && boost.expiresAt < now;

    if (isExpired) {
      // Update status to expired
      await db
        .update(promotedListings)
        .set({ status: "expired" })
        .where(eq(promotedListings.id, boost.id));

      return res.json({ hasBoost: false, boost: { ...boost, status: "expired" } });
    }

    res.json({
      hasBoost: boost.status === "active",
      boost: {
        id: boost.id,
        boostType: boost.boostType,
        status: boost.status,
        startedAt: boost.startedAt,
        expiresAt: boost.expiresAt,
        daysRemaining: Math.ceil((boost.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    console.error("Error fetching boost status:", error);
    res.status(500).json({ error: "Failed to fetch boost status" });
  }
});

// GET /api/boosts/analytics/:promotedListingId - Get analytics for a boosted listing
router.get("/analytics/:promotedListingId", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { promotedListingId } = req.params;

    // Verify the boost belongs to the user
    const boost = await db.query.promotedListings.findFirst({
      where: eq(promotedListings.id, promotedListingId),
    });

    if (!boost) {
      return res.status(404).json({ error: "Boost not found" });
    }

    if (boost.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Fetch analytics data
    const analytics = await db
      .select()
      .from(promotedListingAnalytics)
      .where(eq(promotedListingAnalytics.promotedListingId, promotedListingId))
      .orderBy(desc(promotedListingAnalytics.date));

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        impressions: acc.impressions + (day.impressions || 0),
        views: acc.views + (day.views || 0),
        clicks: acc.clicks + (day.clicks || 0),
        messages: acc.messages + (day.messages || 0),
      }),
      { impressions: 0, views: 0, clicks: 0, messages: 0 }
    );

    res.json({
      boost: {
        id: boost.id,
        boostType: boost.boostType,
        status: boost.status,
        startedAt: boost.startedAt,
        expiresAt: boost.expiresAt,
      },
      totals,
      dailyData: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// POST /api/boosts/track-impression - Track an impression for a boosted listing
router.post("/track-impression", async (req, res) => {
  try {
    const { listingId } = req.body;

    // Find active boost for this listing
    const boost = await db.query.promotedListings.findFirst({
      where: and(
        eq(promotedListings.listingId, listingId),
        eq(promotedListings.status, "active")
      ),
    });

    if (!boost) {
      return res.json({ success: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert analytics record for today
    await db
      .insert(promotedListingAnalytics)
      .values({
        promotedListingId: boost.id,
        date: today,
        impressions: 1,
      })
      .onConflictDoUpdate({
        target: [promotedListingAnalytics.promotedListingId, promotedListingAnalytics.date],
        set: {
          impressions: sql`${promotedListingAnalytics.impressions} + 1`,
        },
      });

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking impression:", error);
    res.status(500).json({ error: "Failed to track impression" });
  }
});

// POST /api/boosts/track-view - Track a view for a boosted listing
router.post("/track-view", async (req, res) => {
  try {
    const { listingId } = req.body;

    const boost = await db.query.promotedListings.findFirst({
      where: and(
        eq(promotedListings.listingId, listingId),
        eq(promotedListings.status, "active")
      ),
    });

    if (!boost) {
      return res.json({ success: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db
      .insert(promotedListingAnalytics)
      .values({
        promotedListingId: boost.id,
        date: today,
        views: 1,
      })
      .onConflictDoUpdate({
        target: [promotedListingAnalytics.promotedListingId, promotedListingAnalytics.date],
        set: {
          views: sql`${promotedListingAnalytics.views} + 1`,
        },
      });

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
});

export default router;

