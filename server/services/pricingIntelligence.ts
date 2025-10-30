import { db } from "../db";
import { listings } from "@shared/schema";
import { eq, and, sql, ne } from "drizzle-orm";

/**
 * Service for pricing intelligence and recommendations
 */

interface PricingAnalysis {
  listingId: string;
  currentPrice: number;
  marketAverage: number;
  marketMedian: number;
  marketMin: number;
  marketMax: number;
  similarListingsCount: number;
  pricePosition: "below" | "at" | "above";
  recommendation: string;
  suggestedPriceRange: {
    min: number;
    max: number;
  };
  isStale: boolean;
  daysSinceCreated: number;
  daysSinceLastView: number | null;
}

/**
 * Analyze pricing for a listing compared to similar items
 */
export async function analyzePricing(listingId: string): Promise<PricingAnalysis | null> {
  try {
    // Get the listing
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return null;
    }

    const currentPrice = parseFloat(listing.price);

    // Find similar active listings (same category, exclude this listing)
    const similarListings = await db.query.listings.findMany({
      where: and(
        eq(listings.category, listing.category),
        eq(listings.status, "active"),
        ne(listings.id, listingId)
      ),
      columns: {
        price: true,
      },
    });

    if (similarListings.length === 0) {
      return {
        listingId,
        currentPrice,
        marketAverage: currentPrice,
        marketMedian: currentPrice,
        marketMin: currentPrice,
        marketMax: currentPrice,
        similarListingsCount: 0,
        pricePosition: "at",
        recommendation: "No similar listings found to compare pricing.",
        suggestedPriceRange: {
          min: currentPrice * 0.8,
          max: currentPrice * 1.2,
        },
        isStale: false,
        daysSinceCreated: 0,
        daysSinceLastView: null,
      };
    }

    // Calculate market statistics
    const prices = similarListings.map(l => parseFloat(l.price)).sort((a, b) => a - b);
    const marketAverage = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const marketMedian = prices[Math.floor(prices.length / 2)];
    const marketMin = prices[0];
    const marketMax = prices[prices.length - 1];

    // Determine price position
    let pricePosition: "below" | "at" | "above";
    if (currentPrice < marketMedian * 0.9) {
      pricePosition = "below";
    } else if (currentPrice > marketMedian * 1.1) {
      pricePosition = "above";
    } else {
      pricePosition = "at";
    }

    // Calculate days since created
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate days since last view
    const daysSinceLastView = listing.lastViewedAt
      ? Math.floor((Date.now() - new Date(listing.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine if listing is stale (no views in 7 days or created 14+ days ago with low views)
    const isStale = (daysSinceLastView !== null && daysSinceLastView >= 7) ||
                    (daysSinceCreated >= 14 && listing.viewCount < 10);

    // Generate recommendation
    let recommendation: string;
    if (isStale && pricePosition === "above") {
      recommendation = `Your listing hasn't received views recently and is priced ${((currentPrice / marketMedian - 1) * 100).toFixed(0)}% above market average. Consider lowering your price to $${(marketMedian * 0.95).toFixed(2)} to attract more buyers.`;
    } else if (isStale) {
      recommendation = `Your listing hasn't received views recently. Try refreshing your photos, improving your description, or lowering your price slightly to $${(currentPrice * 0.9).toFixed(2)}.`;
    } else if (pricePosition === "above") {
      recommendation = `Your price is ${((currentPrice / marketMedian - 1) * 100).toFixed(0)}% above the market median. You may get fewer inquiries. Consider pricing between $${(marketMedian * 0.9).toFixed(2)} and $${(marketMedian * 1.1).toFixed(2)} for optimal results.`;
    } else if (pricePosition === "below") {
      recommendation = `Your price is ${((1 - currentPrice / marketMedian) * 100).toFixed(0)}% below the market median. You could potentially increase your price to $${(marketMedian * 0.95).toFixed(2)} and still sell quickly.`;
    } else {
      recommendation = `Your price is competitive and aligned with the market. Similar items are priced between $${marketMin.toFixed(2)} and $${marketMax.toFixed(2)}.`;
    }

    // Suggested price range (90-110% of market median)
    const suggestedPriceRange = {
      min: Math.round(marketMedian * 0.9 * 100) / 100,
      max: Math.round(marketMedian * 1.1 * 100) / 100,
    };

    return {
      listingId,
      currentPrice,
      marketAverage: Math.round(marketAverage * 100) / 100,
      marketMedian: Math.round(marketMedian * 100) / 100,
      marketMin: Math.round(marketMin * 100) / 100,
      marketMax: Math.round(marketMax * 100) / 100,
      similarListingsCount: similarListings.length,
      pricePosition,
      recommendation,
      suggestedPriceRange,
      isStale,
      daysSinceCreated,
      daysSinceLastView,
    };
  } catch (error) {
    console.error(`Error analyzing pricing for listing ${listingId}:`, error);
    return null;
  }
}

/**
 * Get all stale listings for a seller
 * Stale = no views in 7 days OR created 14+ days ago with <10 views
 */
export async function getStaleListings(userId: string) {
  try {
    const userListings = await db.query.listings.findMany({
      where: and(
        eq(listings.userId, userId),
        eq(listings.status, "active")
      ),
    });

    const now = Date.now();
    const staleListings = userListings.filter(listing => {
      const daysSinceCreated = Math.floor(
        (now - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysSinceLastView = listing.lastViewedAt
        ? Math.floor((now - new Date(listing.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return (daysSinceLastView !== null && daysSinceLastView >= 7) ||
             (daysSinceCreated >= 14 && listing.viewCount < 10);
    });

    return staleListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      price: parseFloat(listing.price),
      viewCount: listing.viewCount,
      daysSinceCreated: Math.floor(
        (now - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      daysSinceLastView: listing.lastViewedAt
        ? Math.floor((now - new Date(listing.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  } catch (error) {
    console.error(`Error getting stale listings for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get pricing insights for all seller's active listings
 */
export async function getSellerPricingInsights(userId: string) {
  try {
    const userListings = await db.query.listings.findMany({
      where: and(
        eq(listings.userId, userId),
        eq(listings.status, "active")
      ),
    });

    const insights = await Promise.all(
      userListings.map(async listing => {
        const analysis = await analyzePricing(listing.id);
        return {
          listingId: listing.id,
          title: listing.title,
          currentPrice: parseFloat(listing.price),
          pricePosition: analysis?.pricePosition || "at",
          isStale: analysis?.isStale || false,
          recommendation: analysis?.recommendation || "",
        };
      })
    );

    // Count listings by price position
    const pricingBreakdown = {
      below: insights.filter(i => i.pricePosition === "below").length,
      at: insights.filter(i => i.pricePosition === "at").length,
      above: insights.filter(i => i.pricePosition === "above").length,
    };

    // Count stale listings
    const staleCount = insights.filter(i => i.isStale).length;

    return {
      totalListings: userListings.length,
      pricingBreakdown,
      staleCount,
      insights: insights.filter(i => i.isStale || i.pricePosition !== "at"), // Show only actionable insights
    };
  } catch (error) {
    console.error(`Error getting pricing insights for user ${userId}:`, error);
    return null;
  }
}

