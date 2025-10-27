import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { 
  meetupSessions, 
  locationHistory, 
  meetupMessages,
  reliabilityScores,
  insertMeetupSessionSchema,
  insertLocationHistorySchema,
  insertMeetupMessageSchema 
} from "../../shared/meetup-schema";
import { eq, and, or, sql } from "drizzle-orm";

const router = Router();

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// POST /api/meetups - Create a new meetup session
router.post("/", requireAuth, async (req, res) => {
  try {
    const { transactionId, listingId, suggestedMeetupLat, suggestedMeetupLng, suggestedMeetupName } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!transactionId || !listingId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // TODO: Verify that the user is part of this transaction (buyer or seller)
    // For now, we'll assume the transaction exists and determine buyer/seller from transaction data

    // Set expiration to 60 minutes from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Create the meetup session
    const [session] = await db.insert(meetupSessions).values({
      transactionId,
      listingId,
      buyerId: userId, // TODO: Get actual buyer/seller IDs from transaction
      sellerId: userId, // Placeholder - should be the other party
      status: "pending",
      initiatedBy: userId,
      expiresAt,
      suggestedMeetupLat,
      suggestedMeetupLng,
      suggestedMeetupName,
    }).returning();

    res.json({ meetupSession: session });
  } catch (error) {
    console.error("Error creating meetup session:", error);
    res.status(500).json({ error: "Failed to create meetup session" });
  }
});

// GET /api/meetups/:id - Get meetup session details
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    res.json({ meetupSession: session });
  } catch (error) {
    console.error("Error fetching meetup session:", error);
    res.status(500).json({ error: "Failed to fetch meetup session" });
  }
});

// PATCH /api/meetups/:id/status - Update session status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { status, currentLat, currentLng } = req.body;

    if (!["active", "waiting", "en_route", "arrived", "cancelled", "completed", "expired"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the session
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update the session
    const updateData: any = { status, updatedAt: new Date() };
    
    // Handle en_route status - calculate ETA
    if (status === "en_route") {
      if (!currentLat || !currentLng) {
        return res.status(400).json({ error: "Current location required for en_route status" });
      }
      
      if (!session.suggestedMeetupLat || !session.suggestedMeetupLng) {
        return res.status(400).json({ error: "Meetup location not set" });
      }
      
      // Import ETA service
      const { calculateETA } = await import("../services/etaService");
      
      // Calculate ETA
      const etaResult = await calculateETA(
        parseFloat(currentLat),
        parseFloat(currentLng),
        parseFloat(session.suggestedMeetupLat),
        parseFloat(session.suggestedMeetupLng)
      );
      
      updateData.enRouteStartedAt = new Date();
      updateData.enRouteUserId = userId;
      updateData.estimatedArrivalTime = etaResult.estimatedArrivalTime;
      updateData.estimatedArrivalMinutes = etaResult.durationInTraffic || etaResult.duration;
    }
    
    if (status === "completed") {
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    }

    const [updatedSession] = await db
      .update(meetupSessions)
      .set(updateData)
      .where(eq(meetupSessions.id, sessionId))
      .returning();

    // If completed, update reliability scores
    if (status === "completed") {
      await updateReliabilityScores(session.buyerId, session.sellerId);
    }
    
    // Broadcast status update via WebSocket
    const { getWebSocketService } = await import("../services/websocketService");
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitToRoom(`meetup:${sessionId}`, "status_updated", {
        sessionId,
        userId,
        status,
        estimatedArrivalMinutes: updateData.estimatedArrivalMinutes,
        estimatedArrivalTime: updateData.estimatedArrivalTime,
        timestamp: new Date(),
      });
    }

    res.json({ meetupSession: updatedSession });
  } catch (error) {
    console.error("Error updating meetup status:", error);
    res.status(500).json({ error: "Failed to update meetup status" });
  }
});

// POST /api/meetups/:id/share - Opt-in to share location
router.post("/:id/share", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Get the session
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update the appropriate sharing flag
    const updateData: any = { updatedAt: new Date() };
    if (userId === session.buyerId) {
      updateData.buyerSharedLocation = true;
    } else {
      updateData.sellerSharedLocation = true;
    }

    // If both have shared, activate the session
    if (
      (userId === session.buyerId && session.sellerSharedLocation) ||
      (userId === session.sellerId && session.buyerSharedLocation)
    ) {
      updateData.status = "active";
    }

    await db
      .update(meetupSessions)
      .set(updateData)
      .where(eq(meetupSessions.id, sessionId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error sharing location:", error);
    res.status(500).json({ error: "Failed to share location" });
  }
});

// POST /api/meetups/:id/location - Update user's location
router.post("/:id/location", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing location data" });
    }

    // Get the session
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update the session with new location
    const updateData: any = { updatedAt: new Date() };
    if (userId === session.buyerId) {
      updateData.buyerLatitude = latitude;
      updateData.buyerLongitude = longitude;
      updateData.buyerLastUpdate = new Date();
    } else {
      updateData.sellerLatitude = latitude;
      updateData.sellerLongitude = longitude;
      updateData.sellerLastUpdate = new Date();
    }

    await db
      .update(meetupSessions)
      .set(updateData)
      .where(eq(meetupSessions.id, sessionId));

    // Store in location history
    await db.insert(locationHistory).values({
      sessionId,
      userId,
      latitude,
      longitude,
      accuracy,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// POST /api/meetups/:id/messages - Send a quick message
router.post("/:id/messages", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { messageType, messageText } = req.body;

    if (!messageType) {
      return res.status(400).json({ error: "Missing message type" });
    }

    // Get the session to verify access
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Create the message
    const [message] = await db.insert(meetupMessages).values({
      sessionId,
      senderId: userId,
      messageType,
      messageText,
    }).returning();

    res.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/meetups/:id/messages - Get messages for a session
router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Get the session to verify access
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }

    // Verify user is part of this session
    if (session.buyerId !== userId && session.sellerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get all messages for this session
    const messages = await db
      .select()
      .from(meetupMessages)
      .where(eq(meetupMessages.sessionId, sessionId))
      .orderBy(meetupMessages.timestamp);

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /api/meetups/user/active - Get active meetup sessions for current user
router.get("/user/active", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await db
      .select()
      .from(meetupSessions)
      .where(
        and(
          or(
            eq(meetupSessions.buyerId, userId),
            eq(meetupSessions.sellerId, userId)
          ),
          or(
            eq(meetupSessions.status, "pending"),
            eq(meetupSessions.status, "active")
          )
        )
      );

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

// Helper function to update reliability scores
async function updateReliabilityScores(buyerId: string, sellerId: string) {
  try {
    // Update for both buyer and seller
    for (const userId of [buyerId, sellerId]) {
      // Get or create reliability score
      let [score] = await db
        .select()
        .from(reliabilityScores)
        .where(eq(reliabilityScores.userId, userId));

      if (!score) {
        [score] = await db.insert(reliabilityScores).values({
          userId,
          totalMeetups: 0,
          completedMeetups: 0,
          cancelledMeetups: 0,
          onTimeCount: 0,
          lateCount: 0,
          noShowCount: 0,
        }).returning();
      }

      // Update counts
      await db
        .update(reliabilityScores)
        .set({
          totalMeetups: sql`${reliabilityScores.totalMeetups} + 1`,
          completedMeetups: sql`${reliabilityScores.completedMeetups} + 1`,
          onTimeCount: sql`${reliabilityScores.onTimeCount} + 1`, // TODO: Calculate based on actual timing
          reliabilityScore: sql`(${reliabilityScores.completedMeetups}::decimal / ${reliabilityScores.totalMeetups}::decimal) * 100`,
          lastUpdated: new Date(),
        })
        .where(eq(reliabilityScores.userId, userId));
    }
  } catch (error) {
    console.error("Error updating reliability scores:", error);
  }
}

export default router;

