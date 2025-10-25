// Message Search Route
import { Router } from "express";
import { db } from "../db";
import { messages, users, listings } from "../../shared/schema";
import { eq, or, and, like, sql } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * GET /api/messages/search?q=query&limit=20&offset=0
 * Search messages by content
 */
router.get("/search", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Search messages where user is involved
    const searchPattern = `%${query.trim()}%`;
    
    const searchResults = await db
      .select({
        id: messages.id,
        listingId: messages.listingId,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderUsername: users.username,
        senderEmail: users.email,
        listingTitle: listings.title,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(listings, eq(messages.listingId, listings.id))
      .where(
        and(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          ),
          sql`LOWER(${messages.content}) LIKE LOWER(${searchPattern})`
        )
      )
      .orderBy(sql`${messages.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          ),
          sql`LOWER(${messages.content}) LIKE LOWER(${searchPattern})`
        )
      );

    const total = totalResult.count;

    res.json({
      results: searchResults,
      query,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + searchResults.length < total,
      },
    });
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ message: "Failed to search messages" });
  }
});

export default router;

