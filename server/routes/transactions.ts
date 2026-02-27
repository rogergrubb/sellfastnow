// Transaction Routes - API Endpoints
// Location: server/routes/transactions.ts

import { Router } from "express";
import { transactionService } from "../services/transactionService";
import { TransactionMessagingService } from "../services/transactionMessagingService";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

// ============================================
// CREATE & MANAGE TRANSACTIONS
// ============================================

/**
 * POST /api/transactions
 * Create a new escrow transaction
 */
router.post("/", async (req, res) => {
  try {
    const { buyerId, sellerId, amount, currency, description, listingId } = req.body;

    if (!buyerId || !sellerId || !amount) {
      return res.status(400).json({ 
        error: "Missing required fields: buyerId, sellerId, amount" 
      });
    }

    const result = await transactionService.createTransaction({
      buyerId,
      sellerId,
      amount: parseFloat(amount),
      currency,
      description,
      listingId,
    });

    // Send automated message for deposit submitted
    if (listingId) {
      try {
        await TransactionMessagingService.notifyDepositSubmitted(
          result.id,
          listingId,
          buyerId,
          sellerId,
          parseFloat(amount)
        );
      } catch (msgError) {
        console.error('Failed to send automated message:', msgError);
        // Don't fail the transaction if message fails
      }
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to create transaction" 
    });
  }
});

/**
 * POST /api/transactions/:id/capture
 * Capture payment and hold funds in escrow
 */
router.post("/:id/capture", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.capturePayment(id);
    res.json(transaction);
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to capture payment" 
    });
  }
});

/**
 * POST /api/transactions/:id/release
 * Release funds to seller (complete transaction)
 */
router.post("/:id/release", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const transaction = await transactionService.releaseTransaction(id, userId);
    
    // Send automated message for transaction completed
    if (transaction.listingId) {
      try {
        await TransactionMessagingService.notifyTransactionCompleted(
          transaction.id,
          transaction.listingId,
          transaction.buyerId,
          transaction.sellerId,
          transaction.amount
        );
        
        // Send review prompts to both parties after a short delay
        setTimeout(async () => {
          try {
            // Prompt buyer to review seller
            await TransactionMessagingService.sendReviewPrompt(
              transaction.id,
              transaction.listingId!,
              transaction.sellerId,
              transaction.buyerId,
              "the seller"
            );

            // Prompt seller to review buyer
            await TransactionMessagingService.sendReviewPrompt(
              transaction.id,
              transaction.listingId!,
              transaction.buyerId,
              transaction.sellerId,
              "the buyer"
            );
          } catch (reviewPromptError) {
            console.error('Failed to send review prompts:', reviewPromptError);
          }
        }, 10000); // Wait 10 seconds after completion message

      } catch (msgError) {
        console.error('Failed to send automated message:', msgError);
      }
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Error releasing transaction:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to release transaction" 
    });
  }
});

/**
 * POST /api/transactions/:id/refund
 * Refund transaction to buyer
 */
router.post("/:id/refund", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const transaction = await transactionService.refundTransaction(id, userId, reason);
    
    // Send automated message for transaction refunded
    if (transaction.listingId) {
      try {
        await TransactionMessagingService.notifyTransactionRefunded(
          transaction.id,
          transaction.listingId,
          transaction.buyerId,
          transaction.sellerId,
          transaction.amount,
          reason
        );
      } catch (msgError) {
        console.error('Failed to send automated message:', msgError);
      }
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Error refunding transaction:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to refund transaction" 
    });
  }
});

/**
 * POST /api/transactions/:id/cancel
 * Cancel transaction (before capture)
 */
router.post("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const transaction = await transactionService.cancelTransaction(id, userId, reason);
    res.json(transaction);
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to cancel transaction" 
    });
  }
});

/**
 * POST /api/transactions/:id/dispute
 * Raise a dispute on a transaction
 */
router.post("/:id/dispute", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ 
        error: "Missing required fields: userId, reason" 
      });
    }

    const transaction = await transactionService.raiseDispute(id, userId, reason);
    res.json(transaction);
  } catch (error) {
    console.error("Error raising dispute:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to raise dispute" 
    });
  }
});

/**
 * POST /api/transactions/:id/mark-shipped
 * Mark order as shipped
 */
router.post("/:id/mark-shipped", async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber } = req.body;

    const transaction = await transactionService.markAsShipped(id, trackingNumber);
    res.json(transaction);
  } catch (error) {
    console.error("Error marking as shipped:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to mark as shipped" 
    });
  }
});

// ============================================
// QUERY TRANSACTIONS
// ============================================

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { db } = await import("../db");
    const { transactions } = await import("../../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch transaction" 
    });
  }
});

/**
 * GET /api/transactions
 * Get all transactions (with pagination)
 */
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { db } = await import("../db");
    const { transactions } = await import("../../shared/schema");
    
    const allTransactions = await db.query.transactions.findMany({
      limit,
      offset,
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });

    res.json(allTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch transactions" 
    });
  }
});

/**
 * GET /api/transactions/buyer/:buyerId
 * Get all transactions for a buyer
 */
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await transactionService.getUserTransactions(buyerId, {
      limit,
      offset,
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching buyer transactions:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch buyer transactions" 
    });
  }
});

/**
 * GET /api/transactions/seller/:sellerId
 * Get all transactions for a seller
 */
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await transactionService.getUserTransactions(sellerId, {
      limit,
      offset,
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching seller transactions:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch seller transactions" 
    });
  }
});

/**
 * GET /api/transactions/user/:userId/stats
 * Get transaction statistics for a user
 */
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await transactionService.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch user stats" 
    });
  }
});

/**
 * POST /api/transactions/mark-sold
 * Mark a listing as sold and create a transaction (for offline/cash sales)
 */
router.post("/mark-sold", isAuthenticated, async (req, res) => {
  try {
    const { listingId, buyerId, amount, paymentMethod } = req.body;
    
    if (!listingId || !buyerId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the listing to verify ownership
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Verify the current user is the seller
    if (listing.userId !== req.user?.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // buyerId can be either a user ID or an email address
    let buyer;
    
    // Check if it's an email (contains @)
    if (buyerId.includes('@')) {
      // Find buyer by email
      buyer = await db.query.users.findFirst({
        where: eq(users.email, buyerId.toLowerCase()),
      });

      // If buyer doesn't exist, create a placeholder account
      if (!buyer) {
        const [newBuyer] = await db.insert(users).values({
          id: crypto.randomUUID(),
          email: buyerId.toLowerCase(),
          firstName: buyerId.split('@')[0],
          lastName: '',
          isEmailVerified: false,
          createdAt: new Date(),
        }).returning();
        buyer = newBuyer;
      }
    } else {
      // It's a user ID, find by ID
      buyer = await db.query.users.findFirst({
        where: eq(users.id, buyerId),
      });
      
      if (!buyer) {
        return res.status(404).json({ error: "Buyer not found" });
      }
    }

    // Create transaction
    const [transaction] = await db.insert(transactions).values({
      id: crypto.randomUUID(),
      buyerId: buyer.id,
      sellerId: listing.userId,
      listingId: listing.id,
      amount: amount,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      createdAt: new Date(),
    }).returning();

    // Mark listing as sold
    await db.update(listings)
      .set({ status: 'sold' })
      .where(eq(listings.id, listingId));

    // Send notifications for sale and purchase
    try {
      const { notificationService } = await import("../services/notificationService");
      const seller = await db.query.users.findFirst({
        where: eq(users.id, listing.userId),
      });
      const buyerName = `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.email;
      const sellerName = `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() || 'the seller';
      
      // Notify seller
      await notificationService.createNotification({
        userId: listing.userId,
        type: "sale",
        title: `Your item sold: ${listing.title}`,
        message: `Congratulations! "${listing.title}" sold to ${buyerName} for $${amount}`,
        relatedId: transaction.id,
        relatedType: "transaction",
        actionUrl: `/dashboard`,
      });
      
      // Notify buyer
      await notificationService.createNotification({
        userId: buyer.id,
        type: "purchase",
        title: `Purchase confirmed: ${listing.title}`,
        message: `You purchased "${listing.title}" from ${sellerName} for $${amount}`,
        relatedId: transaction.id,
        relatedType: "transaction",
        actionUrl: `/dashboard`,
      });
    } catch (error) {
      console.error("Error sending sale notifications:", error);
    }

    res.json({ success: true, transaction });
  } catch (error) {
    console.error("Error marking as sold:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to mark as sold" 
    });
  }
});

/**
 * GET /api/transactions/listing/:listingId/messaged-users
 * Get all users who have messaged about a specific listing
 * Used for the mark-as-sold dialog to show potential buyers
 */
router.get("/listing/:listingId/messaged-users", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: "Missing required parameter: sellerId" });
    }

    const { db } = await import("../db");
    const { messages, users } = await import("../../shared/schema");
    const { eq, or, and, sql } = await import("drizzle-orm");

    // Get all unique users who have messaged about this listing
    // (excluding the seller themselves)
    const messagedUsers = await db
      .selectDistinct({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(messages)
      .innerJoin(users, or(
        and(eq(messages.senderId, users.id), eq(messages.receiverId, sellerId as string)),
        and(eq(messages.receiverId, users.id), eq(messages.senderId, sellerId as string))
      ))
      .where(
        and(
          eq(messages.listingId, listingId),
          sql`${users.id} != ${sellerId}`
        )
      );

    res.json(messagedUsers);
  } catch (error) {
    console.error("Error fetching messaged users:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch messaged users" 
    });
  }
});

/**
 * GET /api/transactions/listing/:listingId
 * Get transaction for a specific listing
 */
router.get("/listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const transaction = await transactionService.getTransactionByListing(listingId);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction by listing:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch transaction" 
    });
  }
});

/**
 * GET /api/transactions/buyer/:buyerId
 * Get all purchases for a buyer (transactions where user is the buyer)
 */
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { db } = await import("../db");
    const { transactions, listings, users } = await import("../../shared/schema");
    const { eq, desc } = await import("drizzle-orm");

    // Get transactions with manual joins for listing and seller data
    const buyerTransactions = await db
      .select({
        id: transactions.id,
        buyerId: transactions.buyerId,
        sellerId: transactions.sellerId,
        listingId: transactions.listingId,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
        // Listing data
        listingTitle: listings.title,
        listingImages: listings.images,
        listingPrice: listings.price,
        // Seller data
        sellerFirstName: users.firstName,
        sellerLastName: users.lastName,
        sellerProfileImage: users.profileImageUrl,
      })
      .from(transactions)
      .leftJoin(listings, eq(transactions.listingId, listings.id))
      .leftJoin(users, eq(transactions.sellerId, users.id))
      .where(eq(transactions.buyerId, buyerId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform to match expected frontend format
    const formattedTransactions = buyerTransactions.map((t) => ({
      id: t.id,
      buyerId: t.buyerId,
      sellerId: t.sellerId,
      listingId: t.listingId,
      amount: t.amount,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      listing: t.listingTitle ? {
        id: t.listingId,
        title: t.listingTitle,
        images: t.listingImages,
        price: t.listingPrice,
      } : null,
      seller: t.sellerFirstName ? {
        id: t.sellerId,
        firstName: t.sellerFirstName,
        lastName: t.sellerLastName,
        profileImageUrl: t.sellerProfileImage,
      } : null,
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching buyer transactions:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch buyer transactions" 
    });
  }
});

/**
 * POST /api/transactions/auto-release
 * Process auto-releases (called by a cron job)
 */
router.post("/auto-release", async (req, res) => {
  try {
    // TODO: Add authentication check for system/admin only
    const results = await transactionService.processAutoReleases();
    res.json(results);
  } catch (error) {
    console.error("Error processing auto-releases:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to process auto-releases" 
    });
  }
});

export default router;
