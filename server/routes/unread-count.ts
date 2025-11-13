import { Router } from "express";
import { db } from "../storage";
import { messages } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * GET /api/messages/unread-count
 * Get the total count of unread messages for the current user
 */
router.get("/unread-count", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Count all unread messages where current user is the receiver
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    const unreadCount = Number(result[0]?.count || 0);

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

export default router;
