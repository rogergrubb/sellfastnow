// Reviews Routes - API Endpoints
// Location: server/routes/reviews.ts

import { Router } from "express";
import { db } from "../db";
import { reviews, userStatistics, transactions } from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

// ============================================
// CREATE & MANAGE REVIEWS
// ============================================

/**
 * POST /api/reviews
 * Create a new review
 * Ratings are 1-10 internally (displayed as 0.5-5.0 stars)
 */
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const {
      listingId,
      transactionId,
      reviewedUserId,
      overallRating,
      communicationRating,
      asDescribedRating,
      punctualityRating,
      professionalismRating,
      reviewTitle,
      reviewText,
      reviewPhotos,
      reviewerRole,
      wouldTransactAgain,
    } = req.body;

    // Validation
    if (!listingId || !reviewedUserId || !overallRating || !reviewText || !reviewerRole) {
      return res.status(400).json({
        error: "Missing required fields: listingId, reviewedUserId, overallRating, reviewText, reviewerRole"
      });
    }

    // Validate ratings are in range 1-10
    const ratings = [
      overallRating,
      communicationRating,
      asDescribedRating,
      punctualityRating,
      professionalismRating
    ].filter(r => r !== undefined && r !== null);

    for (const rating of ratings) {
      if (rating < 1 || rating > 10) {
        return res.status(400).json({
          error: "Ratings must be between 1 and 10 (displayed as 0.5-5.0 stars)"
        });
      }
    }

    // Check if transaction exists (no longer require completion)
    if (transactionId) {
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
      });

      if (!transaction) {
        return res.status(404).json({
          error: "Transaction not found"
        });
      }

      // Verify user is part of the transaction
      if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
        return res.status(403).json({
          error: "You are not authorized to review this transaction"
        });
      }

      // Check if user already reviewed this transaction
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.transactionId, transactionId),
          eq(reviews.reviewerId, userId)
        ),
      });

      if (existingReview) {
        return res.status(400).json({
          error: "You have already reviewed this transaction"
        });
      }
    }

    // Create review
    const [review] = await db
      .insert(reviews)
      .values({
        listingId,
        transactionId: transactionId || null,
        reviewerId: userId,
        reviewedUserId,
        overallRating,
        communicationRating: communicationRating || null,
        asDescribedRating: asDescribedRating || null,
        punctualityRating: punctualityRating || null,
        professionalismRating: professionalismRating || null,
        reviewTitle: reviewTitle || null,
        reviewText,
        reviewPhotos: reviewPhotos || [],
        reviewerRole,
        verifiedTransaction: !!transactionId,
        wouldTransactAgain: wouldTransactAgain || null,
      })
      .returning();

    // Update user statistics
    await updateUserStatisticsAfterReview(reviewedUserId, overallRating);

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create review"
    });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Get all reviews for a user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const role = req.query.role as string; // 'buyer' or 'seller' or undefined for all

    let whereClause = eq(reviews.reviewedUserId, userId);
    
    if (role) {
      whereClause = and(
        eq(reviews.reviewedUserId, userId),
        eq(reviews.reviewerRole, role === 'seller' ? 'buyer' : 'seller')
      ) as any;
    }

    const userReviews = await db.query.reviews.findMany({
      where: whereClause,
      orderBy: [desc(reviews.createdAt)],
      with: {
        reviewer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    res.json(userReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch reviews"
    });
  }
});

/**
 * GET /api/reviews/listing/:listingId
 * Get all reviews for a listing
 */
router.get("/listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    const listingReviews = await db.query.reviews.findMany({
      where: eq(reviews.listingId, listingId),
      orderBy: [desc(reviews.createdAt)],
    });

    res.json(listingReviews);
  } catch (error) {
    console.error("Error fetching listing reviews:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch listing reviews"
    });
  }
});

/**
 * GET /api/reviews/transaction/:transactionId
 * Get reviews for a specific transaction
 */
router.get("/transaction/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transactionReviews = await db.query.reviews.findMany({
      where: eq(reviews.transactionId, transactionId),
      orderBy: [desc(reviews.createdAt)],
    });

    res.json(transactionReviews);
  } catch (error) {
    console.error("Error fetching transaction reviews:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch transaction reviews"
    });
  }
});

/**
 * GET /api/reviews/stats/:userId
 * Get review statistics for a user
 */
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });

    if (!stats) {
      return res.json({
        totalReviewsReceived: 0,
        averageRating: 0,
        fiveStarReviews: 0,
        fourStarReviews: 0,
        threeStarReviews: 0,
        twoStarReviews: 0,
        oneStarReviews: 0,
      });
    }

    res.json({
      totalReviewsReceived: stats.totalReviewsReceived,
      averageRating: stats.averageRating ? parseFloat(stats.averageRating) : 0,
      fiveStarReviews: stats.fiveStarReviews,
      fourStarReviews: stats.fourStarReviews,
      threeStarReviews: stats.threeStarReviews,
      twoStarReviews: stats.twoStarReviews,
      oneStarReviews: stats.oneStarReviews,
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch review stats"
    });
  }
});

/**
 * POST /api/reviews/:id/response
 * Add a seller response to a review
 */
router.post("/:id/response", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { responseText } = req.body;

    if (!responseText) {
      return res.status(400).json({ error: "Response text is required" });
    }

    // Get the review
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only the reviewed user can respond
    if (review.reviewedUserId !== userId) {
      return res.status(403).json({ error: "You can only respond to reviews about you" });
    }

    // Update review with response
    const [updated] = await db
      .update(reviews)
      .set({
        sellerResponse: responseText,
        sellerResponseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error adding review response:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to add review response"
    });
  }
});

/**
 * POST /api/reviews/:id/helpful
 * Mark a review as helpful or not helpful
 */
router.post("/:id/helpful", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body; // true or false

    const [updated] = await db
      .update(reviews)
      .set({
        helpfulCount: helpful
          ? sql`${reviews.helpfulCount} + 1`
          : reviews.helpfulCount,
        notHelpfulCount: !helpful
          ? sql`${reviews.notHelpfulCount} + 1`
          : reviews.notHelpfulCount,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating review helpfulness:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update review helpfulness"
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update user statistics after a new review
 */
async function updateUserStatisticsAfterReview(userId: string, overallRating: number) {
  // Get current stats
  const stats = await db.query.userStatistics.findFirst({
    where: eq(userStatistics.userId, userId),
  });

  if (!stats) {
    // Create new stats record
    await db.insert(userStatistics).values({
      userId,
      totalReviewsReceived: 1,
      averageRating: (overallRating / 2).toFixed(2), // Convert 1-10 to 0.5-5.0
      fiveStarReviews: overallRating >= 9 ? 1 : 0,
      fourStarReviews: overallRating >= 7 && overallRating < 9 ? 1 : 0,
      threeStarReviews: overallRating >= 5 && overallRating < 7 ? 1 : 0,
      twoStarReviews: overallRating >= 3 && overallRating < 5 ? 1 : 0,
      oneStarReviews: overallRating < 3 ? 1 : 0,
    });
  } else {
    // Calculate new average
    const currentTotal = parseFloat(stats.averageRating || "0") * (stats.totalReviewsReceived || 0);
    const newTotal = currentTotal + (overallRating / 2);
    const newCount = (stats.totalReviewsReceived || 0) + 1;
    const newAverage = (newTotal / newCount).toFixed(2);

    // Update stats
    await db
      .update(userStatistics)
      .set({
        totalReviewsReceived: newCount,
        averageRating: newAverage,
        fiveStarReviews: overallRating >= 9
          ? sql`${userStatistics.fiveStarReviews} + 1`
          : userStatistics.fiveStarReviews,
        fourStarReviews: overallRating >= 7 && overallRating < 9
          ? sql`${userStatistics.fourStarReviews} + 1`
          : userStatistics.fourStarReviews,
        threeStarReviews: overallRating >= 5 && overallRating < 7
          ? sql`${userStatistics.threeStarReviews} + 1`
          : userStatistics.threeStarReviews,
        twoStarReviews: overallRating >= 3 && overallRating < 5
          ? sql`${userStatistics.twoStarReviews} + 1`
          : userStatistics.twoStarReviews,
        oneStarReviews: overallRating < 3
          ? sql`${userStatistics.oneStarReviews} + 1`
          : userStatistics.oneStarReviews,
        updatedAt: new Date(),
      })
      .where(eq(userStatistics.userId, userId));
  }
}

export default router;

