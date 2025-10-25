// Transaction Routes - API Endpoints
// Location: server/routes/transactions.ts

import { Router } from "express";
import { transactionService } from "../services/transactionService";
import { TransactionMessagingService } from "../services/transactionMessagingService";

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
