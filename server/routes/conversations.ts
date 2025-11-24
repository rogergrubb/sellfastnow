// Conversation Grouping Routes
// Groups messages by conversation partner for better UX

import { Router } from "express";
import { db } from "../db";
import { messages, users, listings } from "../../shared/schema";
import { eq, or, and, desc, asc, sql } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * GET /api/conversations
 * Get all conversations for the current user, grouped by conversation partner
 * Returns: Array of conversations with last message, unread count, and participant info
 */
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get all messages where user is involved
    const userMessages = await db
      .select({
        id: messages.id,
        listingId: messages.listingId,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        messageType: messages.messageType,
        metadata: messages.metadata,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    // Group messages by conversation (listing + other user)
    const conversationMap = new Map<string, any>();

    for (const message of userMessages) {
      // Determine the other user in the conversation
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      // Create unique conversation key (listing + other user)
      const conversationKey = `${message.listingId}_${otherUserId}`;

      if (!conversationMap.has(conversationKey)) {
        // This is the most recent message for this conversation
        conversationMap.set(conversationKey, {
          listingId: message.listingId,
          otherUserId,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            messageType: message.messageType,
            metadata: message.metadata,
            isRead: message.isRead,
            createdAt: message.createdAt,
          },
          unreadCount: 0,
          messageCount: 0,
        });
      }

      const conversation = conversationMap.get(conversationKey);
      conversation.messageCount++;

      // Count unread messages (messages sent to current user that are unread)
      if (message.receiverId === userId && !message.isRead) {
        conversation.unreadCount++;
      }
    }

    // Convert map to array
    const conversations = Array.from(conversationMap.values());

    // Fetch user details for all conversation partners
    const otherUserIds = conversations.map(c => c.otherUserId);
    const conversationUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(sql`${users.id} IN ${sql.raw(`(${otherUserIds.map(id => `'${id}'`).join(',')})`)}`)
      .execute();

    const userMap = new Map(conversationUsers.map(u => [u.id, u]));

    // Fetch listing details for all conversations
    const listingIds = conversations.map(c => c.listingId);
    const conversationListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        images: listings.images,
      })
      .from(listings)
      .where(sql`${listings.id} IN ${sql.raw(`(${listingIds.map(id => `'${id}'`).join(',')})`)}`)
      .execute();

    const listingMap = new Map(conversationListings.map(l => [l.id, l]));

    // Enrich conversations with user and listing data
    const enrichedConversations = conversations.map(conv => ({
      ...conv,
      otherUser: userMap.get(conv.otherUserId) || null,
      listing: listingMap.get(conv.listingId) || null,
    }));

    // Sort by last message time (most recent first)
    enrichedConversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    res.json(enrichedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

/**
 * GET /api/conversations/:listingId/:otherUserId
 * Get all messages for a specific conversation
 * Returns: Array of messages with pagination
 */
router.get("/:listingId/:otherUserId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { listingId, otherUserId } = req.params;

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get messages for this conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.listingId, listingId),
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
          )
        )
      )
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.listingId, listingId),
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
          )
        )
      );

    const total = totalResult.count;

    res.json({
      messages: conversationMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ message: "Failed to fetch conversation messages" });
  }
});

export default router;

