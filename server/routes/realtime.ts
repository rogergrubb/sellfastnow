import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import {
  updateUserOnlineStatus,
  isUserOnline,
  getUsersOnlineStatus,
  getOnlineUsers,
  removeUserOnlineStatus,
} from "../services/onlineStatus";
import {
  setUserTyping,
  removeUserTyping,
  getUsersTyping,
  isUserTyping,
} from "../services/typingIndicator";

const router = Router();

/**
 * Update user's online status (heartbeat)
 * POST /api/realtime/heartbeat
 */
router.post("/heartbeat", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    updateUserOnlineStatus(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating online status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

/**
 * Check if a user is online
 * GET /api/realtime/status/:userId
 */
router.get("/status/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const online = isUserOnline(userId);
    res.json({ userId, online });
  } catch (error) {
    console.error("Error checking online status:", error);
    res.status(500).json({ message: "Failed to check status" });
  }
});

/**
 * Get online status for multiple users
 * POST /api/realtime/status/batch
 * Body: { userIds: string[] }
 */
router.post("/status/batch", isAuthenticated, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const statusMap = getUsersOnlineStatus(userIds);
    const statuses = Object.fromEntries(statusMap);
    
    res.json(statuses);
  } catch (error) {
    console.error("Error getting batch status:", error);
    res.status(500).json({ message: "Failed to get statuses" });
  }
});

/**
 * Set user as typing in a conversation
 * POST /api/realtime/typing/:conversationId
 */
router.post("/typing/:conversationId", isAuthenticated, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    setUserTyping(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error setting typing status:", error);
    res.status(500).json({ message: "Failed to set typing status" });
  }
});

/**
 * Remove user from typing status
 * DELETE /api/realtime/typing/:conversationId
 */
router.delete("/typing/:conversationId", isAuthenticated, async (req: any, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    removeUserTyping(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing typing status:", error);
    res.status(500).json({ message: "Failed to remove typing status" });
  }
});

/**
 * Get users currently typing in a conversation
 * GET /api/realtime/typing/:conversationId
 */
router.get("/typing/:conversationId", isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const typingUsers = getUsersTyping(conversationId);
    res.json({ conversationId, typingUsers });
  } catch (error) {
    console.error("Error getting typing users:", error);
    res.status(500).json({ message: "Failed to get typing users" });
  }
});

/**
 * Logout - remove user from online status
 * POST /api/realtime/logout
 */
router.post("/logout", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    removeUserOnlineStatus(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
});

export default router;

