// Transaction Service with Trust System Integration
// Location: server/services/transactionService.ts

import Stripe from "stripe";
import { db } from "../db";
import { transactions, trustScores, trustEvents, badges } from "../../shared/schema";
import { eq, and, sql, gte } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export const transactionService = {
  /**
   * Create a new transaction (escrow)
   */
  async createTransaction(data: {
    buyerId: string;
    sellerId: string;
    amount: number;
    currency?: string;
    description?: string;
    listingId?: string;
  }) {
    if (data.buyerId === data.sellerId) {
      throw new Error("Buyer and seller cannot be the same user");
    }

    if (data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Create Stripe PaymentIntent for escrow
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || "usd",
      payment_method_types: ["card"],
      capture_method: "manual", // Important: Don't capture immediately
      metadata: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        listingId: data.listingId || "",
      },
    });

    // Create transaction record
    const [transaction] = await db
      .insert(transactions)
      .values({
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        listingId: data.listingId,
        amount: data.amount.toString(),
        currency: data.currency || "usd",
        description: data.description,
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
      })
      .returning();

    return {
      transaction,
      clientSecret: paymentIntent.client_secret,
    };
  },

  /**
   * Capture payment and hold funds in escrow
   */
  async capturePayment(transactionId: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error(`Cannot capture payment for transaction with status: ${transaction.status}`);
    }

    if (!transaction.stripePaymentIntentId) {
      throw new Error("No Stripe PaymentIntent ID found");
    }

    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(transaction.stripePaymentIntentId);

    // Set auto-release date (48 hours from now)
    const autoReleaseAt = new Date();
    autoReleaseAt.setHours(autoReleaseAt.getHours() + 48);

    // Update transaction to 'held' status
    const [updated] = await db
      .update(transactions)
      .set({
        status: "held",
        heldAt: new Date(),
        autoReleaseAt,
        stripeChargeId: paymentIntent.latest_charge as string,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return updated;
  },

  /**
   * Release funds to seller (complete the transaction)
   */
  async releaseTransaction(transactionId: string, releasedBy: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Only buyer or auto-release system can release funds
    if (releasedBy !== transaction.buyerId && releasedBy !== "system") {
      throw new Error("Only the buyer can release funds");
    }

    if (transaction.status !== "held") {
      throw new Error(`Cannot release transaction with status: ${transaction.status}`);
    }

    if (transaction.isDisputed) {
      throw new Error("Cannot release disputed transaction");
    }

    // Transfer funds to seller via Stripe
    let transferId: string | undefined;
    if (transaction.stripePaymentIntentId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(parseFloat(transaction.amount) * 100), // Convert to cents
          currency: transaction.currency,
          destination: transaction.sellerId, // Should be seller's Stripe Connect account ID
          transfer_group: transaction.id,
          metadata: {
            transactionId: transaction.id,
            buyerId: transaction.buyerId,
            sellerId: transaction.sellerId,
          },
        });
        transferId = transfer.id;
      } catch (error) {
        console.error("Stripe transfer error:", error);
        throw new Error("Failed to transfer funds to seller");
      }
    }

    // Update transaction status
    const [updated] = await db
      .update(transactions)
      .set({
        status: "released",
        releasedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(transaction.metadata as object),
          stripeTransferId: transferId,
        },
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // 🔗 UPDATE TRUST SCORES FOR BOTH PARTIES
    await this.updateTrustScoreOnCompletion(
      transaction.sellerId, 
      transactionId, 
      parseFloat(transaction.amount)
    );
    
    // Buyer gets smaller credit for completing transaction
    await this.updateTrustScoreOnCompletion(
      transaction.buyerId, 
      transactionId, 
      parseFloat(transaction.amount) * 0.5
    );

    return updated;
  },

  /**
   * Refund transaction to buyer
   */
  async refundTransaction(transactionId: string, refundedBy: string, reason?: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Only seller or system can issue refund
    if (refundedBy !== transaction.sellerId && refundedBy !== "system") {
      throw new Error("Only the seller can issue a refund");
    }

    if (transaction.status !== "held") {
      throw new Error(`Cannot refund transaction with status: ${transaction.status}`);
    }

    // Create Stripe refund
    let refundId: string | undefined;
    if (transaction.stripePaymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: transaction.stripePaymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            transactionId: transaction.id,
            refundedBy,
          },
        });
        refundId = refund.id;
      } catch (error) {
        console.error("Stripe refund error:", error);
        throw new Error("Failed to process refund");
      }
    }

    // Update transaction status
    const [updated] = await db
      .update(transactions)
      .set({
        status: "refunded",
        refundedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(transaction.metadata as object),
          stripeRefundId: refundId,
          refundReason: reason,
        },
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // 🔗 UPDATE TRUST SCORES - Small penalty for refunds
    await this.logTrustEvent(transaction.sellerId, transactionId, "transaction_refunded", -2);

    return updated;
  },

  /**
   * Cancel a transaction (before payment is captured)
   */
  async cancelTransaction(transactionId: string, cancelledBy: string, reason?: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Only buyer or seller can cancel
    if (cancelledBy !== transaction.buyerId && cancelledBy !== transaction.sellerId) {
      throw new Error("Only buyer or seller can cancel the transaction");
    }

    if (transaction.status !== "pending" && transaction.status !== "held") {
      throw new Error(`Cannot cancel transaction with status: ${transaction.status}`);
    }

    // Cancel Stripe PaymentIntent
    if (transaction.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(transaction.stripePaymentIntentId);
      } catch (error) {
        console.error("Stripe cancellation error:", error);
        // Continue anyway - we still want to mark it as cancelled in our system
      }
    }

    // Update transaction status
    const [updated] = await db
      .update(transactions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(transaction.metadata as object),
          cancelledBy,
          cancellationReason: reason,
        },
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // 🔗 UPDATE TRUST SCORES
    // Track cancelled transactions but don't heavily penalize
    await db
      .update(trustScores)
      .set({
        cancelledTransactions: sql`${trustScores.cancelledTransactions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(trustScores.userId, transaction.sellerId));

    await this.logTrustEvent(transaction.sellerId, transactionId, "transaction_cancelled", -1);

    return updated;
  },

  /**
   * Raise a dispute on a transaction
   */
  async raiseDispute(transactionId: string, disputedBy: string, reason: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (disputedBy !== transaction.buyerId && disputedBy !== transaction.sellerId) {
      throw new Error("Only buyer or seller can raise a dispute");
    }

    if (transaction.status !== "held") {
      throw new Error("Can only dispute transactions with held status");
    }

    if (transaction.isDisputed) {
      throw new Error("Transaction is already disputed");
    }

    // Update transaction
    const [updated] = await db
      .update(transactions)
      .set({
        isDisputed: true,
        disputeReason: reason,
        disputeOpenedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(transaction.metadata as object),
          disputedBy,
        },
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // 🔗 UPDATE TRUST SCORES - Penalty for disputes
    const penalizedParty = disputedBy === transaction.buyerId 
      ? transaction.sellerId 
      : transaction.buyerId;

    await db
      .update(trustScores)
      .set({
        disputedTransactions: sql`${trustScores.disputedTransactions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(trustScores.userId, penalizedParty));

    await this.logTrustEvent(penalizedParty, transactionId, "dispute_opened", -10);

    return updated;
  },

  /**
   * Mark order as shipped
   */
  async markAsShipped(transactionId: string, trackingNumber?: string) {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "held") {
      throw new Error("Can only mark held transactions as shipped");
    }

    const [updated] = await db
      .update(transactions)
      .set({
        shippedAt: new Date(),
        trackingNumber,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return updated;
  },

  /**
   * Auto-release funds after 48 hours
   */
  async processAutoReleases() {
    const now = new Date();

    // Find all transactions that should be auto-released
    const transactionsToRelease = await db.query.transactions.findMany({
      where: and(
        eq(transactions.status, "held"),
        eq(transactions.isDisputed, false),
        gte(transactions.autoReleaseAt, now)
      ),
    });

    const results = [];
    for (const transaction of transactionsToRelease) {
      try {
        const released = await this.releaseTransaction(transaction.id, "system");
        results.push({ success: true, transactionId: transaction.id, released });
      } catch (error) {
        console.error(`Failed to auto-release transaction ${transaction.id}:`, error);
        results.push({ 
          success: false, 
          transactionId: transaction.id, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return results;
  },

  /**
   * Get transactions for a user (buyer or seller)
   */
  async getUserTransactions(userId: string, options?: { limit?: number; offset?: number }) {
    return db.query.transactions.findMany({
      where: sql`${transactions.buyerId} = ${userId} OR ${transactions.sellerId} = ${userId}`,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  },

  /**
   * Get transaction statistics for a user
   */
  async getUserStats(userId: string) {
    const userTransactions = await this.getUserTransactions(userId);

    const stats = {
      total: userTransactions.length,
      successful: userTransactions.filter((t) => t.status === "released").length,
      disputed: userTransactions.filter((t) => t.isDisputed).length,
      cancelled: userTransactions.filter((t) => t.status === "cancelled").length,
      pending: userTransactions.filter((t) => t.status === "pending").length,
      held: userTransactions.filter((t) => t.status === "held").length,
      totalVolume: userTransactions
        .filter((t) => t.status === "released")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      asBuyer: userTransactions.filter((t) => t.buyerId === userId).length,
      asSeller: userTransactions.filter((t) => t.sellerId === userId).length,
    };

    return stats;
  },

  // ============================================
  // 🔗 TRUST SYSTEM INTEGRATION METHODS
  // ============================================

  /**
   * Update trust score when transaction completes successfully
   */
  async updateTrustScoreOnCompletion(userId: string, transactionId: string, amount: number) {
    // Get existing trust score or create new one
    let score = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, userId),
    });

    if (!score) {
      // Create initial trust score
      const [newScore] = await db.insert(trustScores).values({ userId }).returning();
      score = newScore;
    }

    const newTotalTransactions = score.totalTransactions + 1;
    const newSuccessfulTransactions = score.successfulTransactions + 1;
    const newTotalVolume = parseFloat(score.totalVolume) + amount;

    // Calculate transaction score (0-25 based on success rate)
    const successRate = newSuccessfulTransactions / (newSuccessfulTransactions + score.disputedTransactions || 1);
    const transactionScore = Math.min(25, Math.round(successRate * 25));

    // Update trust score
    await db
      .update(trustScores)
      .set({
        totalTransactions: newTotalTransactions,
        successfulTransactions: newSuccessfulTransactions,
        totalVolume: newTotalVolume.toString(),
        transactionScore,
        overallScore: score.verificationScore + transactionScore + score.reputationScore + score.responsivenessScore,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trustScores.userId, userId));

    // Log trust event
    await this.logTrustEvent(userId, transactionId, "transaction_completed", 5);

    // Check for badge awards
    await this.checkAndAwardBadges(userId);
  },

  /**
   * Log a trust event
   */
  async logTrustEvent(
    userId: string, 
    transactionId: string, 
    eventType: string, 
    scoreDelta: number
  ) {
    const score = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, userId),
    });

    await db.insert(trustEvents).values({
      userId,
      transactionId,
      eventType,
      eventCategory: scoreDelta > 0 ? "positive" : scoreDelta < 0 ? "negative" : "neutral",
      scoreBefore: score?.overallScore,
      scoreAfter: (score?.overallScore || 0) + scoreDelta,
      scoreDelta,
      reason: `${eventType} for transaction ${transactionId}`,
    });
  },

  /**
   * Check and award badges based on achievements
   */
  async checkAndAwardBadges(userId: string) {
    const score = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, userId),
    });

    if (!score) return;

    const badgesToAward: Array<{ type: string; name: string; icon: string; color: string }> = [];

    // Power Seller Badge (50+ successful transactions)
    if (score.successfulTransactions >= 50) {
      badgesToAward.push({
        type: "power_seller",
        name: "Power Seller",
        icon: "🏆",
        color: "gold",
      });
    }

    // Trusted Member Badge (trust score > 80)
    if (score.overallScore >= 80) {
      badgesToAward.push({
        type: "trusted_member",
        name: "Trusted Member",
        icon: "⭐",
        color: "blue",
      });
    }

    // Fast Trader Badge (20+ successful transactions)
    if (score.successfulTransactions >= 20) {
      badgesToAward.push({
        type: "fast_trader",
        name: "Fast Trader",
        icon: "⚡",
        color: "yellow",
      });
    }

    // Award badges
    for (const badge of badgesToAward) {
      // Check if badge already exists
      const existing = await db.query.badges.findFirst({
        where: and(
          eq(badges.userId, userId),
          eq(badges.badgeType, badge.type),
          eq(badges.isActive, true)
        ),
      });

      if (!existing) {
        await db.insert(badges).values({
          userId,
          badgeType: badge.type,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          badgeColor: badge.color,
        });
      }
    }
  },
};