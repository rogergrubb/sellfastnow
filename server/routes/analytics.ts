import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import {
  getListingAnalytics,
  getSellerAnalytics,
  getListingQualityScore,
} from "../services/listingAnalytics";
import {
  analyzePricing,
  getStaleListings,
  getSellerPricingInsights,
} from "../services/pricingIntelligence";
import {
  getSellerSalesAnalytics,
  calculatePlatformFeeSavings,
} from "../services/salesAnalytics";
import { db } from "../db";
import { listings } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Get analytics for a specific listing
 * GET /api/analytics/listings/:id
 */
router.get("/listings/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify the listing belongs to the authenticated user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
      columns: { userId: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const analytics = await getListingAnalytics(id);

    if (!analytics) {
      return res.status(404).json({ message: "Analytics not found" });
    }

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching listing analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

/**
 * Get quality score for a specific listing
 * GET /api/analytics/listings/:id/quality
 */
router.get("/listings/:id/quality", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify the listing belongs to the authenticated user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
      columns: { userId: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const qualityScore = await getListingQualityScore(id);

    if (qualityScore === null) {
      return res.status(404).json({ message: "Quality score not available" });
    }

    res.json({ listingId: id, qualityScore });
  } catch (error) {
    console.error("Error fetching quality score:", error);
    res.status(500).json({ message: "Failed to fetch quality score" });
  }
});

/**
 * Get analytics for all listings by the authenticated seller
 * GET /api/analytics/seller
 */
router.get("/seller", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const analytics = await getSellerAnalytics(userId);

    if (!analytics) {
      return res.status(404).json({ message: "Analytics not found" });
    }

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

/**
 * Get pricing analysis for a specific listing
 * GET /api/analytics/listings/:id/pricing
 */
router.get("/listings/:id/pricing", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify the listing belongs to the authenticated user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, id),
      columns: { userId: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const pricingAnalysis = await analyzePricing(id);

    if (!pricingAnalysis) {
      return res.status(404).json({ message: "Pricing analysis not available" });
    }

    res.json(pricingAnalysis);
  } catch (error) {
    console.error("Error fetching pricing analysis:", error);
    res.status(500).json({ message: "Failed to fetch pricing analysis" });
  }
});

/**
 * Get stale listings for the authenticated seller
 * GET /api/analytics/seller/stale-listings
 */
router.get("/seller/stale-listings", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const staleListings = await getStaleListings(userId);
    res.json(staleListings);
  } catch (error) {
    console.error("Error fetching stale listings:", error);
    res.status(500).json({ message: "Failed to fetch stale listings" });
  }
});

/**
 * Get pricing insights for all seller's listings
 * GET /api/analytics/seller/pricing-insights
 */
router.get("/seller/pricing-insights", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const insights = await getSellerPricingInsights(userId);

    if (!insights) {
      return res.status(404).json({ message: "Pricing insights not available" });
    }

    res.json(insights);
  } catch (error) {
    console.error("Error fetching pricing insights:", error);
    res.status(500).json({ message: "Failed to fetch pricing insights" });
  }
});

/**
 * Get sales analytics for the authenticated seller
 * GET /api/analytics/seller/sales?period=30d
 */
router.get("/seller/sales", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const period = (req.query.period as "7d" | "30d" | "90d" | "1y" | "all") || "30d";
    
    const salesAnalytics = await getSellerSalesAnalytics(userId, period);
    res.json(salesAnalytics);
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ message: "Failed to fetch sales analytics" });
  }
});

/**
 * Calculate platform fee savings
 * POST /api/analytics/fee-comparison
 */
router.post("/fee-comparison", async (req, res) => {
  try {
    const { salePrice, totalSales } = req.body;

    if (!salePrice || !totalSales) {
      return res.status(400).json({ message: "salePrice and totalSales are required" });
    }

    const comparison = calculatePlatformFeeSavings(
      parseFloat(salePrice),
      parseInt(totalSales)
    );

    res.json(comparison);
  } catch (error) {
    console.error("Error calculating fee comparison:", error);
    res.status(500).json({ message: "Failed to calculate fee comparison" });
  }
});

export default router;

