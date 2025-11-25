import { Router } from "express";
import { db } from "../db";
import { listings } from "@shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { stripe } from "../stripe";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

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
  console.log("✅ Feature listing endpoint called");
  console.log("Request params:", req.params);
  console.log("Request body:", req.body);
  console.log("Auth user ID:", req.user?.id);
  
  try {
    const { id } = req.params;
    const { duration } = req.body as { duration: "24h" | "48h" | "7d" };
    const userId = req.user?.id;
    
    console.log("Processing feature request for listing:", id, "duration:", duration, "user:", userId);

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
    
    console.log("Creating Stripe PaymentIntent with amount:", amount);
    console.log("Stripe instance available:", !!stripe);

    try {
      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          listing_id: id,
          duration,
          feature_type: "homepage_carousel",
          user_id: userId,
        },
        description: `Feature listing: ${listing.title} for ${duration}`,
      });

      console.log("✅ Stripe PaymentIntent created:", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        clientSecretPresent: !!paymentIntent.client_secret,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount,
        duration,
      });
    } catch (stripeError: any) {
      console.error("❌ Stripe PaymentIntent creation failed:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      });
      throw stripeError;
    }
  } catch (error: any) {
    console.error("❌ Error creating feature payment:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code,
    });
    res.status(500).json({ 
      message: "Failed to create payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

/**
 * POST /api/featured-listings/:id/activate
 * Manually activate featured status after successful payment
 * Called by frontend after Stripe redirect
 */
router.post("/:id/activate", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { paymentIntentId, duration } = req.body as { paymentIntentId: string; duration: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
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

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Verify the payment intent matches this listing
    if (paymentIntent.metadata.listing_id !== id) {
      return res.status(400).json({ message: "Payment does not match listing" });
    }

    // Calculate featured_until timestamp
    const now = new Date();
    const durationHours: Record<string, number> = {
      "24h": 24,
      "48h": 48,
      "7d": 168,
    };

    const hours = durationHours[duration];
    const featuredUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Update the listing
    await db
      .update(listings)
      .set({
        featuredUntil,
        featuredPaymentId: paymentIntentId,
        featuredCreatedAt: now,
        featuredDuration: duration,
      })
      .where(eq(listings.id, id));

    console.log(`✅ Listing ${id} featured until ${featuredUntil}`);

    res.json({ success: true, featuredUntil });
  } catch (error) {
    console.error("❌ Error activating featured status:", error);
    res.status(500).json({ message: "Failed to activate featured status" });
  }
});

/**
 * POST /api/featured-listings/webhook
 * Stripe webhook to handle successful feature payments
 */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { listing_id, duration } = paymentIntent.metadata;

      if (!listing_id || !duration) {
        console.error("Missing metadata in payment intent:", paymentIntent.id);
        return res.status(400).json({ message: "Missing required metadata" });
      }

      // Calculate featured_until timestamp based on duration
      const now = new Date();
      const durationHours: Record<string, number> = {
        "24h": 24,
        "48h": 48,
        "7d": 168, // 7 days = 168 hours
      };

      const hours = durationHours[duration];
      const featuredUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);

      // Update the listing
      await db
        .update(listings)
        .set({
          featuredUntil,
          featuredPaymentId: paymentIntent.id,
          featuredCreatedAt: now,
          featuredDuration: duration,
        })
        .where(eq(listings.id, listing_id));

      console.log(`✅ Listing ${listing_id} featured until ${featuredUntil}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ message: "Webhook handler failed" });
  }
});

export default router;
