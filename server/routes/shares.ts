import { Express, Request, Response } from "express";
import { db } from "../db";
import { socialShares } from "../../shared/shares-schema";
import { listings } from "../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export function registerSharesRoutes(app: Express) {
  // Track a social share
  app.post("/api/shares/track", async (req: Request, res: Response) => {
    try {
      const {
        listingId,
        platform,
        shareType,
        shareUrl,
      } = req.body;

      // Validation
      if (!platform || !shareType || !shareUrl) {
        return res.status(400).json({
          error: "Missing required fields: platform, shareType, shareUrl",
        });
      }

      // Get user ID from session (if logged in)
      const userId = (req.user as any)?.id || null;

      // Get user agent and referrer from request headers
      const userAgent = req.headers["user-agent"] || null;
      const referrer = req.headers["referer"] || req.headers["referrer"] || null;

      // Insert share record
      const [share] = await db
        .insert(socialShares)
        .values({
          listingId: listingId || null,
          userId,
          platform,
          shareType,
          shareUrl,
          userAgent,
          referrer,
        })
        .returning();

      res.json({
        success: true,
        shareId: share.id,
        message: "Share tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({
        error: "Failed to track share",
      });
    }
  });

  // Get share statistics for a listing
  app.get("/api/shares/listing/:listingId", async (req: Request, res: Response) => {
    try {
      const { listingId } = req.params;

      // Get all shares for this listing
      const shares = await db
        .select()
        .from(socialShares)
        .where(eq(socialShares.listingId, listingId))
        .orderBy(desc(socialShares.createdAt));

      // Calculate statistics
      const stats = {
        totalShares: shares.length,
        facebookShares: shares.filter((s) => s.platform === "facebook").length,
        twitterShares: shares.filter((s) => s.platform === "twitter").length,
        whatsappShares: shares.filter((s) => s.platform === "whatsapp").length,
        copyLinkShares: shares.filter((s) => s.platform === "copy_link").length,
        lastSharedAt: shares[0]?.createdAt || null,
        sharesByPlatform: shares.reduce((acc: any, share) => {
          acc[share.platform] = (acc[share.platform] || 0) + 1;
          return acc;
        }, {}),
        recentShares: shares.slice(0, 10), // Last 10 shares
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching share statistics:", error);
      res.status(500).json({
        error: "Failed to fetch share statistics",
      });
    }
  });

  // Get share statistics for a user's listings
  app.get("/api/shares/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Get all listings for this user
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.userId, userId));

      const listingIds = userListings.map((l) => l.id);

      if (listingIds.length === 0) {
        return res.json({
          totalShares: 0,
          listingStats: [],
        });
      }

      // Get all shares for user's listings
      const shares = await db
        .select()
        .from(socialShares)
        .where(
          sql`${socialShares.listingId} IN (${sql.join(listingIds.map((id) => sql`${id}`), sql`, `)})`
        );

      // Group by listing
      const listingStats = userListings.map((listing) => {
        const listingShares = shares.filter((s) => s.listingId === listing.id);
        return {
          listingId: listing.id,
          listingTitle: listing.title,
          totalShares: listingShares.length,
          facebookShares: listingShares.filter((s) => s.platform === "facebook").length,
          twitterShares: listingShares.filter((s) => s.platform === "twitter").length,
          whatsappShares: listingShares.filter((s) => s.platform === "whatsapp").length,
          copyLinkShares: listingShares.filter((s) => s.platform === "copy_link").length,
          lastSharedAt: listingShares[0]?.createdAt || null,
        };
      }).sort((a, b) => b.totalShares - a.totalShares); // Sort by most shared

      res.json({
        totalShares: shares.length,
        listingStats,
        sharesByPlatform: shares.reduce((acc: any, share) => {
          acc[share.platform] = (acc[share.platform] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("Error fetching user share statistics:", error);
      res.status(500).json({
        error: "Failed to fetch user share statistics",
      });
    }
  });

  // Get overall platform statistics (admin/analytics)
  app.get("/api/shares/stats/platform", async (req: Request, res: Response) => {
    try {
      const allShares = await db
        .select()
        .from(socialShares)
        .orderBy(desc(socialShares.createdAt));

      const stats = {
        totalShares: allShares.length,
        sharesByPlatform: allShares.reduce((acc: any, share) => {
          acc[share.platform] = (acc[share.platform] || 0) + 1;
          return acc;
        }, {}),
        sharesByType: allShares.reduce((acc: any, share) => {
          acc[share.shareType] = (acc[share.shareType] || 0) + 1;
          return acc;
        }, {}),
        recentShares: allShares.slice(0, 20),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform statistics:", error);
      res.status(500).json({
        error: "Failed to fetch platform statistics",
      });
    }
  });
}

