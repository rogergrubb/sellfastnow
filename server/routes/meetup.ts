import { Router } from "express";
import { db } from "../db";
import { meetupSessions, locationHistory, meetupMessages, users } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { calculateETA, formatETA } from "../services/etaService";

const router = Router();

// Create a new meetup session
router.post("/", async (req, res) => {
  try {
    const { listingId, buyerId, sellerId, meetupLatitude, meetupLongitude, meetupAddress } = req.body;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 60 minute expiration
    
    const [session] = await db.insert(meetupSessions).values({
      listingId,
      buyerId,
      sellerId,
      meetupLatitude,
      meetupLongitude,
      meetupAddress,
      expiresAt,
      status: "pending",
    }).returning();
    
    res.json(session);
  } catch (error) {
    console.error("Error creating meetup session:", error);
    res.status(500).json({ error: "Failed to create meetup session" });
  }
});

// Get meetup session details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, id));
    
    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }
    
    res.json(session);
  } catch (error) {
    console.error("Error fetching meetup session:", error);
    res.status(500).json({ error: "Failed to fetch meetup session" });
  }
});

// Update meetup session status (including "on my way")
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId, estimatedArrivalMinutes } = req.body;
    
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    // If status is "en_route", record who started and when
    if (status === "en_route") {
      updateData.enRouteStartedAt = new Date();
      updateData.enRouteStartedBy = userId;
      
      if (estimatedArrivalMinutes) {
        updateData.estimatedArrivalMinutes = estimatedArrivalMinutes;
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + estimatedArrivalMinutes);
        updateData.estimatedArrivalTime = eta;
      }
    }
    
    // If status is "arrived", record arrival time
    if (status === "arrived") {
      const [session] = await db
        .select()
        .from(meetupSessions)
        .where(eq(meetupSessions.id, id));
      
      if (session) {
        if (userId === session.buyerId) {
          updateData.buyerArrivedAt = new Date();
        } else if (userId === session.sellerId) {
          updateData.sellerArrivedAt = new Date();
        }
      }
    }
    
    const [updatedSession] = await db
      .update(meetupSessions)
      .set(updateData)
      .where(eq(meetupSessions.id, id))
      .returning();
    
    res.json(updatedSession);
  } catch (error) {
    console.error("Error updating meetup status:", error);
    res.status(500).json({ error: "Failed to update meetup status" });
  }
});

// Update location consent
router.post("/:id/consent", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, id));
    
    if (!session) {
      return res.status(404).json({ error: "Meetup session not found" });
    }
    
    const updateData: any = { updatedAt: new Date() };
    
    if (userId === session.buyerId) {
      updateData.buyerConsented = true;
      updateData.buyerConsentedAt = new Date();
    } else if (userId === session.sellerId) {
      updateData.sellerConsented = true;
      updateData.sellerConsentedAt = new Date();
    }
    
    // If both consented, activate the session
    if ((updateData.buyerConsented || session.buyerConsented) && 
        (updateData.sellerConsented || session.sellerConsented)) {
      updateData.status = "active";
    }
    
    const [updatedSession] = await db
      .update(meetupSessions)
      .set(updateData)
      .where(eq(meetupSessions.id, id))
      .returning();
    
    res.json(updatedSession);
  } catch (error) {
    console.error("Error updating consent:", error);
    res.status(500).json({ error: "Failed to update consent" });
  }
});

// Update location
router.post("/:id/location", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, latitude, longitude, accuracy } = req.body;
    
    await db.insert(locationHistory).values({
      sessionId: id,
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

// Send quick message
router.post("/:id/message", async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, messageType, messageContent } = req.body;
    
    const [message] = await db.insert(meetupMessages).values({
      sessionId: id,
      senderId,
      messageType,
      messageContent,
    }).returning();
    
    res.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Calculate ETA
router.post("/:id/calculate-eta", async (req, res) => {
  try {
    const { id } = req.params;
    const { userLatitude, userLongitude } = req.body;
    
    const [session] = await db
      .select()
      .from(meetupSessions)
      .where(eq(meetupSessions.id, id));
    
    if (!session || !session.meetupLatitude || !session.meetupLongitude) {
      return res.status(404).json({ error: "Meetup location not found" });
    }
    
    // Calculate ETA using Google Maps API or Haversine fallback
    const etaResult = await calculateETA(
      userLatitude,
      userLongitude,
      parseFloat(session.meetupLatitude),
      parseFloat(session.meetupLongitude)
    );
    
    const estimatedMinutes = etaResult.durationInTraffic || etaResult.duration;
    const eta = etaResult.estimatedArrivalTime;
    
    // Update session with new ETA
    await db
      .update(meetupSessions)
      .set({
        estimatedArrivalMinutes: estimatedMinutes,
        estimatedArrivalTime: eta,
        updatedAt: new Date(),
      })
      .where(eq(meetupSessions.id, id));
    
    res.json({
      distance: etaResult.distance,
      estimatedMinutes,
      estimatedArrivalTime: eta,
      formattedETA: formatETA(estimatedMinutes),
    });
  } catch (error) {
    console.error("Error calculating ETA:", error);
    res.status(500).json({ error: "Failed to calculate ETA" });
  }
});

export default router;

