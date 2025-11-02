// Notification Routes (New Comprehensive System)
// API endpoints for managing notifications and preferences

import { Router } from "express";
import { db } from "../db";
import { notificationService } from "../services/notificationService";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/notifications-new
 * Get all notifications for the current user
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifications = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * GET /api/notifications-new/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

/**
 * PUT /api/notifications-new/:id/read
 * Mark a notification as read
 */
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = await notificationService.markAsRead(notificationId, userId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * PUT /api/notifications-new/read-all
 * Mark all notifications as read
 */
router.put("/read-all", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const success = await notificationService.markAllAsRead(userId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

/**
 * DELETE /api/notifications-new/:id
 * Delete a notification
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    const success = await notificationService.deleteNotification(notificationId, userId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

/**
 * GET /api/notifications-new/preferences
 * Get user notification preferences
 */
router.get("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await notificationService.getUserPreferences(userId);

    if (preferences) {
      res.json(preferences);
    } else {
      res.status(404).json({ error: "Preferences not found" });
    }
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

/**
 * PUT /api/notifications-new/preferences
 * Update user notification preferences
 */
router.put("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    const updated = await notificationService.updatePreferences(userId, updates);

    if (updated) {
      res.json(updated);
    } else {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

/**
 * POST /api/notifications-new/test
 * Create a test notification (development only)
 */
router.post("/test", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    await notificationService.createNotification({
      userId,
      type: "system",
      title: "Test Notification",
      message: "This is a test notification to verify the system is working correctly.",
      actionUrl: "/dashboard",
    });

    res.json({ success: true, message: "Test notification created" });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({ error: "Failed to create test notification" });
  }
});

export default router;
