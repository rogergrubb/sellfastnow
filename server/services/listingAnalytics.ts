import { db } from "../db";
import { listings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Service for tracking and managing listing analytics
 */

/**
 * Track a view for a listing
 * Increments view count and updates last viewed timestamp
 */
export async function trackListingView(listingId: string): Promise<void> {
  try {
    await db
      .update(listings)
      .set({
        viewCount: sql`${listings.viewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(listings.id, listingId));
  } catch (error) {
    console.error(`Error tracking view for listing ${listingId}:`, error);
  }
}

/**
 * Get analytics for a specific listing
 */
export async function getListingAnalytics(listingId: string) {
  try {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
      columns: {
        id: true,
        title: true,
        viewCount: true,
        lastViewedAt: true,
        createdAt: true,
      },
    });

    if (!listing) {
      return null;
    }

    // Get favorite count
    const favoriteCountResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM favorites
      WHERE listing_id = ${listingId}
    `);
    const favoriteCount = parseInt(favoriteCountResult.rows[0]?.count || "0");

    // Get message count
    const messageCountResult = await db.execute(sql`
      SELECT COUNT(DISTINCT conversation_id) as count
      FROM conversations
      WHERE listing_id = ${listingId}
    `);
    const messageCount = parseInt(messageCountResult.rows[0]?.count || "0");

    // Get offer count
    const offerCountResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM offers
      WHERE listing_id = ${listingId}
    `);
    const offerCount = parseInt(offerCountResult.rows[0]?.count || "0");

    // Calculate days since creation
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate conversion metrics
    const viewToMessageRate = listing.viewCount > 0 
      ? (messageCount / listing.viewCount * 100).toFixed(1)
      : "0.0";
    
    const viewToOfferRate = listing.viewCount > 0
      ? (offerCount / listing.viewCount * 100).toFixed(1)
      : "0.0";

    return {
      listingId: listing.id,
      title: listing.title,
      viewCount: listing.viewCount,
      favoriteCount,
      messageCount,
      offerCount,
      lastViewedAt: listing.lastViewedAt,
      createdAt: listing.createdAt,
      daysSinceCreation,
      viewToMessageRate: parseFloat(viewToMessageRate),
      viewToOfferRate: parseFloat(viewToOfferRate),
    };
  } catch (error) {
    console.error(`Error getting analytics for listing ${listingId}:`, error);
    return null;
  }
}

/**
 * Get analytics for all listings by a seller
 */
export async function getSellerAnalytics(userId: string) {
  try {
    // Get all active listings for the seller
    const sellerListings = await db.query.listings.findMany({
      where: eq(listings.userId, userId),
      columns: {
        id: true,
        title: true,
        viewCount: true,
        status: true,
        createdAt: true,
        lastViewedAt: true,
      },
    });

    // Get aggregate stats
    const totalViews = sellerListings.reduce((sum, l) => sum + l.viewCount, 0);
    const activeListings = sellerListings.filter(l => l.status === 'active').length;
    const totalListings = sellerListings.length;

    // Get total favorites across all listings
    const favoritesResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM favorites
      WHERE listing_id IN (
        SELECT id FROM listings WHERE user_id = ${userId}
      )
    `);
    const totalFavorites = parseInt(favoritesResult.rows[0]?.count || "0");

    // Get total messages across all listings
    const messagesResult = await db.execute(sql`
      SELECT COUNT(DISTINCT conversation_id) as count
      FROM conversations
      WHERE listing_id IN (
        SELECT id FROM listings WHERE user_id = ${userId}
      )
    `);
    const totalMessages = parseInt(messagesResult.rows[0]?.count || "0");

    // Get total offers across all listings
    const offersResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM offers
      WHERE listing_id IN (
        SELECT id FROM listings WHERE user_id = ${userId}
      )
    `);
    const totalOffers = parseInt(offersResult.rows[0]?.count || "0");

    // Get sold count
    const soldListings = sellerListings.filter(l => l.status === 'sold').length;

    // Calculate average metrics
    const avgViewsPerListing = totalListings > 0 
      ? (totalViews / totalListings).toFixed(1)
      : "0.0";

    // Calculate conversion rates
    const viewToMessageRate = totalViews > 0
      ? (totalMessages / totalViews * 100).toFixed(1)
      : "0.0";

    const viewToOfferRate = totalViews > 0
      ? (totalOffers / totalViews * 100).toFixed(1)
      : "0.0";

    const listingToSaleRate = totalListings > 0
      ? (soldListings / totalListings * 100).toFixed(1)
      : "0.0";

    // Get top performing listings (by views)
    const topListings = sellerListings
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(l => ({
        id: l.id,
        title: l.title,
        viewCount: l.viewCount,
        status: l.status,
      }));

    return {
      summary: {
        totalListings,
        activeListings,
        soldListings,
        totalViews,
        totalFavorites,
        totalMessages,
        totalOffers,
        avgViewsPerListing: parseFloat(avgViewsPerListing),
        viewToMessageRate: parseFloat(viewToMessageRate),
        viewToOfferRate: parseFloat(viewToOfferRate),
        listingToSaleRate: parseFloat(listingToSaleRate),
      },
      topListings,
      allListings: sellerListings.map(l => ({
        id: l.id,
        title: l.title,
        viewCount: l.viewCount,
        status: l.status,
        createdAt: l.createdAt,
        lastViewedAt: l.lastViewedAt,
      })),
    };
  } catch (error) {
    console.error(`Error getting seller analytics for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get listing quality score (1-10)
 * Based on: title length, description length, number of images, price set
 */
export async function getListingQualityScore(listingId: string): Promise<number | null> {
  try {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
      columns: {
        title: true,
        description: true,
        images: true,
        price: true,
      },
    });

    if (!listing) {
      return null;
    }

    let score = 0;

    // Title quality (0-2 points)
    if (listing.title.length >= 20 && listing.title.length <= 80) {
      score += 2;
    } else if (listing.title.length >= 10) {
      score += 1;
    }

    // Description quality (0-3 points)
    if (listing.description.length >= 200) {
      score += 3;
    } else if (listing.description.length >= 100) {
      score += 2;
    } else if (listing.description.length >= 50) {
      score += 1;
    }

    // Images (0-3 points)
    const imageCount = listing.images.length;
    if (imageCount >= 5) {
      score += 3;
    } else if (imageCount >= 3) {
      score += 2;
    } else if (imageCount >= 1) {
      score += 1;
    }

    // Price set (0-2 points)
    if (listing.price && parseFloat(listing.price) > 0) {
      score += 2;
    }

    return score;
  } catch (error) {
    console.error(`Error calculating quality score for listing ${listingId}:`, error);
    return null;
  }
}

