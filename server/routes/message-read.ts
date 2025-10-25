// Message Read Receipt Route
import { Router } from "express";
import { db } from "../db";
import { messages } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";
import { getWebSocketService } from "../services/websocketService";

const router = Router();

/**
 * POST /api/messages/:messageId/read
 * Mark a message as read
 */
router.post("/:messageId/read", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { messageId } = req.params;

    // Get the message
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the receiver can mark as read
    if (message.receiverId !== userId) {
      return res.status(403).json({ message: "Not authorized to mark this message as read" });
    }

    // Update message as read
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();

    // Broadcast read receipt via WebSocket
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcastMessageRead(messageId, userId, message.senderId);
      console.log('📖 Message read receipt broadcasted');
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Failed to mark message as read" });
  }
});

export default router;

