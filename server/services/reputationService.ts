// Reputation Service - Calculate and manage user reputation scores
// Location: server/services/reputationService.ts

import { db } from "../db";
import { userStatistics, reviews, transactions, trustScores, penalties } from "../../shared/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

export const reputationService = {
  /**
   * Calculate comprehensive reputation score for a user
   */
  async calculateReputationScore(userId: string) {
    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });

    if (!stats) {
      return {
        overallScore: 0,
        sellerRating: 0,
        buyerRating: 0,
        trustLevel: "new",
        warnings: [],
      };
    }

    // Calculate seller success rate
    const sellerSuccessRate = stats.totalSales > 0
      ? (stats.successfulSales / stats.totalSales) * 100
      : 0;

    // Calculate buyer success rate
    const buyerSuccessRate = stats.totalPurchases > 0
      ? (stats.successfulPurchases / stats.totalPurchases) * 100
      : 0;

    // Calculate overall success rate
    const totalTransactions = stats.totalSales + stats.totalPurchases;
    const successfulTransactions = stats.successfulSales + stats.successfulPurchases;
    const overallSuccessRate = totalTransactions > 0
      ? (successfulTransactions / totalTransactions) * 100
      : 0;

    // Calculate average rating (already in 0.5-5.0 scale)
    const avgRating = parseFloat(stats.averageRating || "0");

    // Calculate last-minute cancellation rate (ANTI-FRAUD METRIC)
    const totalCancellations = (stats.cancelledBySeller || 0) + (stats.cancelledByBuyer || 0);
    const lastMinuteCancellations = (stats.lastMinuteCancelsBySeller || 0) + (stats.lastMinuteCancelsByBuyer || 0);
    const lastMinuteCancelRate = totalCancellations > 0
      ? (lastMinuteCancellations / totalCancellations) * 100
      : 0;

    // Calculate response rate
    const responseRate = parseFloat(stats.responseRatePercent || "0");

    // OVERALL SCORE CALCULATION (0-100)
    let overallScore = 0;

    // 1. Review Rating Component (40 points max)
    overallScore += (avgRating / 5.0) * 40;

    // 2. Success Rate Component (30 points max)
    overallScore += (overallSuccessRate / 100) * 30;

    // 3. Transaction Volume Component (15 points max)
    const volumeScore = Math.min(totalTransactions / 50, 1) * 15;
    overallScore += volumeScore;

    // 4. Responsiveness Component (10 points max)
    overallScore += (responseRate / 100) * 10;

    // 5. Verification Component (5 points max)
    let verificationScore = 0;
    if (stats.phoneVerified) verificationScore += 2;
    if (stats.emailVerified) verificationScore += 1;
    if (stats.idVerified) verificationScore += 2;
    overallScore += verificationScore;

    // ANTI-FRAUD PENALTIES
    const penalties: string[] = [];

    // Penalty for high last-minute cancellation rate
    if (lastMinuteCancelRate > 30 && totalCancellations >= 3) {
      overallScore -= 15;
      penalties.push("High last-minute cancellation rate");
    } else if (lastMinuteCancelRate > 15 && totalCancellations >= 2) {
      overallScore -= 8;
      penalties.push("Moderate last-minute cancellation rate");
    }

    // Penalty for recent cancellations (90 days)
    if ((stats.recentCancellations90d || 0) > 5) {
      overallScore -= 10;
      penalties.push("Multiple recent cancellations");
    }

    // Penalty for no-shows
    const totalNoShows = (stats.sellerNoShows || 0) + (stats.buyerNoShows || 0);
    if (totalNoShows > 3) {
      overallScore -= 20;
      penalties.push("Multiple no-shows");
    } else if (totalNoShows > 1) {
      overallScore -= 10;
      penalties.push("Some no-shows");
    }

    // Ensure score is between 0-100
    overallScore = Math.max(0, Math.min(100, overallScore));

    // Determine trust level
    let trustLevel = "new";
    if (overallScore >= 90 && totalTransactions >= 20) {
      trustLevel = "elite";
    } else if (overallScore >= 75 && totalTransactions >= 10) {
      trustLevel = "trusted";
    } else if (overallScore >= 60 && totalTransactions >= 5) {
      trustLevel = "established";
    } else if (totalTransactions >= 1) {
      trustLevel = "building";
    }

    // Calculate separate seller and buyer ratings
    const sellerRating = avgRating; // Simplified - could be more sophisticated
    const buyerRating = avgRating; // Simplified - could be more sophisticated

    return {
      overallScore: Math.round(overallScore),
      sellerRating,
      buyerRating,
      sellerSuccessRate,
      buyerSuccessRate,
      overallSuccessRate,
      trustLevel,
      totalTransactions,
      lastMinuteCancelRate,
      responseRate,
      warnings: penalties,
      metrics: {
        avgRating,
        totalReviews: stats.totalReviewsReceived || 0,
        verificationScore,
        volumeScore: Math.round(volumeScore),
        lastMinuteCancellations,
        totalCancellations,
        totalNoShows,
      },
    };
  },

  /**
   * Detect potential fraud patterns
   */
  async detectFraudPatterns(userId: string) {
    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });

    if (!stats) {
      return { isSuspicious: false, patterns: [] };
    }

    const patterns: string[] = [];
    let suspicionScore = 0;

    // Pattern 1: High last-minute cancellation rate
    const totalCancellations = (stats.cancelledBySeller || 0) + (stats.cancelledByBuyer || 0);
    const lastMinuteCancellations = (stats.lastMinuteCancelsBySeller || 0) + (stats.lastMinuteCancelsByBuyer || 0);
    
    if (totalCancellations >= 3) {
      const lastMinuteRate = (lastMinuteCancellations / totalCancellations) * 100;
      if (lastMinuteRate > 50) {
        patterns.push("Very high last-minute cancellation rate (>50%)");
        suspicionScore += 30;
      } else if (lastMinuteRate > 30) {
        patterns.push("High last-minute cancellation rate (>30%)");
        suspicionScore += 15;
      }
    }

    // Pattern 2: Multiple no-shows
    const totalNoShows = (stats.sellerNoShows || 0) + (stats.buyerNoShows || 0);
    if (totalNoShows >= 3) {
      patterns.push(`Multiple no-shows (${totalNoShows})`);
      suspicionScore += 25;
    }

    // Pattern 3: Recent spike in cancellations
    if ((stats.recentCancellations90d || 0) > 5) {
      patterns.push("Recent spike in cancellations (last 90 days)");
      suspicionScore += 20;
    }

    // Pattern 4: Low success rate with high volume
    const totalTransactions = (stats.totalSales || 0) + (stats.totalPurchases || 0);
    const successfulTransactions = (stats.successfulSales || 0) + (stats.successfulPurchases || 0);
    
    if (totalTransactions >= 10) {
      const successRate = (successfulTransactions / totalTransactions) * 100;
      if (successRate < 50) {
        patterns.push("Low transaction success rate (<50%)");
        suspicionScore += 25;
      }
    }

    // Pattern 5: Many negative reviews
    const totalReviews = stats.totalReviewsReceived || 0;
    const negativeReviews = (stats.oneStarReviews || 0) + (stats.twoStarReviews || 0);
    
    if (totalReviews >= 5) {
      const negativeRate = (negativeReviews / totalReviews) * 100;
      if (negativeRate > 40) {
        patterns.push("High negative review rate (>40%)");
        suspicionScore += 20;
      }
    }

    // Pattern 6: Poor responsiveness
    const responseRate = parseFloat(stats.responseRatePercent || "100");
    if (responseRate < 30 && (stats.totalMessagesReceived || 0) >= 10) {
      patterns.push("Very low response rate (<30%)");
      suspicionScore += 15;
    }

    const isSuspicious = suspicionScore >= 50;

    return {
      isSuspicious,
      suspicionScore,
      patterns,
      recommendation: isSuspicious
        ? "Consider manual review or additional verification"
        : "No significant fraud patterns detected",
    };
  },

  /**
   * Get reputation summary for display
   */
  async getReputationSummary(userId: string) {
    const [score, fraud, stats] = await Promise.all([
      this.calculateReputationScore(userId),
      this.detectFraudPatterns(userId),
      db.query.userStatistics.findFirst({
        where: eq(userStatistics.userId, userId),
      }),
    ]);

    return {
      score,
      fraud,
      stats,
      badges: await this.calculateBadges(userId, stats),
    };
  },

  /**
   * Calculate which badges a user has earned
   */
  async calculateBadges(userId: string, stats: any) {
    const badges: Array<{
      type: string;
      name: string;
      icon: string;
      description: string;
    }> = [];

    if (!stats) return badges;

    // Verification badges
    if (stats.phoneVerified) {
      badges.push({
        type: "phone_verified",
        name: "Phone Verified",
        icon: "📱",
        description: "Phone number verified",
      });
    }

    if (stats.emailVerified) {
      badges.push({
        type: "email_verified",
        name: "Email Verified",
        icon: "✉️",
        description: "Email address verified",
      });
    }

    if (stats.idVerified) {
      badges.push({
        type: "id_verified",
        name: "ID Verified",
        icon: "🆔",
        description: "Government ID verified",
      });
    }

    // Performance badges
    const totalTransactions = (stats.totalSales || 0) + (stats.totalPurchases || 0);
    
    if (totalTransactions >= 100) {
      badges.push({
        type: "power_seller",
        name: "Power Seller",
        icon: "⭐",
        description: "100+ successful transactions",
      });
    } else if (totalTransactions >= 50) {
      badges.push({
        type: "top_seller",
        name: "Top Seller",
        icon: "🏆",
        description: "50+ successful transactions",
      });
    } else if (totalTransactions >= 10) {
      badges.push({
        type: "established_seller",
        name: "Established",
        icon: "✓",
        description: "10+ successful transactions",
      });
    }

    // Fast responder badge
    const responseRate = parseFloat(stats.responseRatePercent || "0");
    const avgResponseTime = stats.avgResponseTimeMinutes || 999;
    
    if (responseRate >= 90 && avgResponseTime <= 60) {
      badges.push({
        type: "fast_responder",
        name: "Fast Responder",
        icon: "⚡",
        description: "Responds within 1 hour",
      });
    }

    // Reliable badge (low cancellation rate)
    const totalCancellations = (stats.cancelledBySeller || 0) + (stats.cancelledByBuyer || 0);
    const cancellationRate = totalTransactions > 0
      ? (totalCancellations / totalTransactions) * 100
      : 0;
    
    if (totalTransactions >= 10 && cancellationRate < 5) {
      badges.push({
        type: "reliable",
        name: "Reliable",
        icon: "🛡️",
        description: "Very low cancellation rate",
      });
    }

    // High rating badge
    const avgRating = parseFloat(stats.averageRating || "0");
    const totalReviews = stats.totalReviewsReceived || 0;
    
    if (avgRating >= 4.8 && totalReviews >= 10) {
      badges.push({
        type: "highly_rated",
        name: "Highly Rated",
        icon: "⭐⭐⭐⭐⭐",
        description: "4.8+ star rating",
      });
    }

    return badges;
  },

  /**
   * Update user statistics after a transaction completes
   */
  async updateStatsAfterTransaction(
    userId: string,
    role: "buyer" | "seller",
    success: boolean
  ) {
    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });

    if (!stats) {
      // Create new stats record
      await db.insert(userStatistics).values({
        userId,
        totalSales: role === "seller" ? 1 : 0,
        successfulSales: role === "seller" && success ? 1 : 0,
        totalPurchases: role === "buyer" ? 1 : 0,
        successfulPurchases: role === "buyer" && success ? 1 : 0,
        recentTransactions90d: 1,
      });
    } else {
      // Update existing stats
      if (role === "seller") {
        await db
          .update(userStatistics)
          .set({
            totalSales: sql`${userStatistics.totalSales} + 1`,
            successfulSales: success
              ? sql`${userStatistics.successfulSales} + 1`
              : userStatistics.successfulSales,
            recentTransactions90d: sql`${userStatistics.recentTransactions90d} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(userStatistics.userId, userId));
      } else {
        await db
          .update(userStatistics)
          .set({
            totalPurchases: sql`${userStatistics.totalPurchases} + 1`,
            successfulPurchases: success
              ? sql`${userStatistics.successfulPurchases} + 1`
              : userStatistics.successfulPurchases,
            recentTransactions90d: sql`${userStatistics.recentTransactions90d} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(userStatistics.userId, userId));
      }
    }

    // Recalculate success rates
    await this.recalculateSuccessRates(userId);
  },

  /**
   * Recalculate success rates for a user
   */
  async recalculateSuccessRates(userId: string) {
    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });

    if (!stats) return;

    const sellerSuccessRate = stats.totalSales > 0
      ? ((stats.successfulSales / stats.totalSales) * 100).toFixed(2)
      : "0";

    const buyerSuccessRate = stats.totalPurchases > 0
      ? ((stats.successfulPurchases / stats.totalPurchases) * 100).toFixed(2)
      : "0";

    const totalTransactions = stats.totalSales + stats.totalPurchases;
    const successfulTransactions = stats.successfulSales + stats.successfulPurchases;
    const overallSuccessRate = totalTransactions > 0
      ? ((successfulTransactions / totalTransactions) * 100).toFixed(2)
      : "0";

    await db
      .update(userStatistics)
      .set({
        sellerSuccessRate,
        buyerSuccessRate,
        overallSuccessRate,
        updatedAt: new Date(),
      })
      .where(eq(userStatistics.userId, userId));
  },
};

