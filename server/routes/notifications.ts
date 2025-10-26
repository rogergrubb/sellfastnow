import express from "express";
import { db } from "../db";
import { messages, offers, listings, users } from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = express.Router();

// Get unread notifications (messages and offers)
router.get("/unread", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = req.user.id;

    // Get unread messages where user is the recipient
    const unreadMessages = await db
      .select({
        id: messages.id,
        listingId: messages.listingId,
        listingTitle: listings.title,
        listingImage: listings.images,
        senderName: users.username,
        message: messages.content,
        timestamp: messages.createdAt,
      })
      .from(messages)
      .innerJoin(listings, eq(messages.listingId, listings.id))
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.read, false)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(5);

    // Get unread offers where user is the listing owner
    const unreadOffers = await db
      .select({
        id: offers.id,
        listingId: offers.listingId,
        listingTitle: listings.title,
        listingImage: listings.images,
        senderName: users.username,
        message: offers.message,
        offerAmount: offers.amount,
        depositAmount: offers.depositAmount,
        timestamp: offers.createdAt,
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(users, eq(offers.buyerId, users.id))
      .where(
        and(
          eq(listings.sellerId, userId),
          eq(offers.status, "pending")
        )
      )
      .orderBy(desc(offers.createdAt))
      .limit(5);

    // Format notifications
    const messageNotifications = unreadMessages.map((msg) => ({
      id: `msg-${msg.id}`,
      type: "message" as const,
      listingId: msg.listingId,
      listingTitle: msg.listingTitle,
      listingImage: msg.listingImage ? JSON.parse(msg.listingImage)[0] : undefined,
      senderName: msg.senderName,
      message: msg.message,
      timestamp: msg.timestamp,
    }));

    const offerNotifications = unreadOffers.map((offer) => ({
      id: `offer-${offer.id}`,
      type: "offer" as const,
      listingId: offer.listingId,
      listingTitle: offer.listingTitle,
      listingImage: offer.listingImage ? JSON.parse(offer.listingImage)[0] : undefined,
      senderName: offer.senderName,
      message: offer.message,
      offerAmount: offer.offerAmount,
      depositAmount: offer.depositAmount,
      timestamp: offer.timestamp,
    }));

    // Combine and sort by timestamp
    const allNotifications = [...messageNotifications, ...offerNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    res.json(allNotifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;

