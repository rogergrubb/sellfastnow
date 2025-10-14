// Trust System Service
// Handles all trust score calculations and operations

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface TrustScore {
  userId: string;
  overallScore: number;
  scoreLevel: ScoreLevel;
  riskLevel: RiskLevel;
  
  // Component Scores
  verificationScore: number;
  transactionScore: number;
  reputationScore: number;
  activityScore: number;
  responsivenessScore: number;
  
  // Verification Status
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  paymentVerified: boolean;
  
  // Metrics
  totalTransactions: number;
  successfulTransactions: number;
  averageRating: number | null;
  totalReviews: number;
  
  lastCalculatedAt: Date;
}

export type ScoreLevel = 'new' | 'building' | 'established' | 'trusted' | 'elite';
export type RiskLevel = 'unknown' | 'low' | 'medium' | 'high' | 'critical';
export type EventCategory = 'verification' | 'transaction' | 'reputation' | 'activity' | 'flag';

export interface TrustEvent {
  userId: string;
  eventType: string;
  eventCategory: EventCategory;
  eventAction: string;
  scoreDelta?: number;
  componentAffected?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
}

export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  scoreRequired: number;
  color: string;
}

// ============================================
// TRUST SCORE SERVICE
// ============================================

export class TrustScoreService {
  
  /**
   * Initialize trust score for a new user
   */
  async initializeUserTrust(userId: string): Promise<void> {
    await prisma.$executeRaw`
      SELECT initialize_trust_score(${userId})
    `;
  }
  
  /**
   * Get trust score for a user
   */
  async getTrustScore(userId: string): Promise<TrustScore | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM trust_scores WHERE user_id = ${userId}
    `;
    
    if (result.length === 0) {
      // Initialize if doesn't exist
      await this.initializeUserTrust(userId);
      return this.getTrustScore(userId);
    }
    
    const score = result[0];
    return {
      userId: score.user_id,
      overallScore: score.overall_score,
      scoreLevel: score.score_level,
      riskLevel: score.risk_level,
      verificationScore: score.verification_score,
      transactionScore: score.transaction_score,
      reputationScore: score.reputation_score,
      activityScore: score.activity_score,
      responsivenessScore: score.responsiveness_score,
      emailVerified: score.email_verified,
      phoneVerified: score.phone_verified,
      idVerified: score.id_verified,
      addressVerified: score.address_verified,
      paymentVerified: score.payment_verified,
      totalTransactions: score.total_transactions,
      successfulTransactions: score.successful_transactions,
      averageRating: score.average_rating,
      totalReviews: score.total_reviews,
      lastCalculatedAt: score.last_calculated_at,
    };
  }
  
  /**
   * Calculate and update trust score
   */
  async calculateTrustScore(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT calculate_overall_trust_score(${userId}) as score
    `;
    return result[0].score;
  }
  
  /**
   * Record a trust event
   */
  async recordTrustEvent(event: TrustEvent): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO trust_events (
        user_id, event_type, event_category, event_action,
        score_delta, component_affected, related_entity_type,
        related_entity_id, metadata
      ) VALUES (
        ${event.userId}, ${event.eventType}, ${event.eventCategory},
        ${event.eventAction}, ${event.scoreDelta || 0},
        ${event.componentAffected}, ${event.relatedEntityType},
        ${event.relatedEntityId}, ${JSON.stringify(event.metadata || {})}::jsonb
      )
    `;
  }
  
  /**
   * Update verification status
   */
  async updateVerification(
    userId: string,
    verificationType: 'email' | 'phone' | 'id' | 'address' | 'payment',
    verified: boolean
  ): Promise<void> {
    const field = `${verificationType}_verified`;
    
    await prisma.$executeRaw`
      UPDATE trust_scores
      SET ${prisma.Prisma.raw(field)} = ${verified},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    
    if (verified) {
      await this.recordTrustEvent({
        userId,
        eventType: `${verificationType}_verification`,
        eventCategory: 'verification',
        eventAction: 'verified',
        componentAffected: 'verification',
      });
    }
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Update transaction metrics
   */
  async updateTransactionMetrics(
    userId: string,
    transactionId: string,
    status: 'completed' | 'cancelled' | 'disputed',
    amount?: number
  ): Promise<void> {
    const updates: Record<string, any> = {};
    
    switch (status) {
      case 'completed':
        updates.totalTransactions = prisma.Prisma.sql`total_transactions + 1`;
        updates.successfulTransactions = prisma.Prisma.sql`successful_transactions + 1`;
        if (amount) {
          updates.totalVolume = prisma.Prisma.sql`total_volume + ${amount}`;
        }
        
        await this.recordTrustEvent({
          userId,
          eventType: 'transaction_completed',
          eventCategory: 'transaction',
          eventAction: 'completed',
          relatedEntityType: 'transaction',
          relatedEntityId: transactionId,
          metadata: { amount },
        });
        break;
        
      case 'cancelled':
        updates.totalTransactions = prisma.Prisma.sql`total_transactions + 1`;
        updates.cancelledTransactions = prisma.Prisma.sql`cancelled_transactions + 1`;
        
        await this.recordTrustEvent({
          userId,
          eventType: 'transaction_cancelled',
          eventCategory: 'transaction',
          eventAction: 'cancelled',
          relatedEntityType: 'transaction',
          relatedEntityId: transactionId,
        });
        break;
        
      case 'disputed':
        updates.disputedTransactions = prisma.Prisma.sql`disputed_transactions + 1`;
        
        await this.recordTrustEvent({
          userId,
          eventType: 'transaction_disputed',
          eventCategory: 'transaction',
          eventAction: 'disputed',
          relatedEntityType: 'transaction',
          relatedEntityId: transactionId,
        });
        break;
    }
    
    // Apply updates
    const setParts = Object.entries(updates).map(
      ([key, value]) => prisma.Prisma.sql`${prisma.Prisma.raw(key)} = ${value}`
    );
    
    if (setParts.length > 0) {
      await prisma.$executeRaw`
        UPDATE trust_scores
        SET ${prisma.Prisma.join(setParts, ', ')},
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Update review metrics
   */
  async updateReviewMetrics(
    userId: string,
    reviewId: string,
    rating: number
  ): Promise<void> {
    // Get current review stats
    const current = await prisma.$queryRaw<any[]>`
      SELECT total_reviews, average_rating
      FROM trust_scores
      WHERE user_id = ${userId}
    `;
    
    const totalReviews = current[0]?.total_reviews || 0;
    const currentAvg = current[0]?.average_rating || 0;
    
    // Calculate new average
    const newAvg = ((currentAvg * totalReviews) + rating) / (totalReviews + 1);
    
    await prisma.$executeRaw`
      UPDATE trust_scores
      SET total_reviews = total_reviews + 1,
          average_rating = ${newAvg},
          positive_reviews = positive_reviews + ${rating >= 4 ? 1 : 0},
          negative_reviews = negative_reviews + ${rating <= 2 ? 1 : 0},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    
    await this.recordTrustEvent({
      userId,
      eventType: 'review_received',
      eventCategory: 'reputation',
      eventAction: 'review_added',
      relatedEntityType: 'review',
      relatedEntityId: reviewId,
      metadata: { rating },
    });
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Update listing metrics
   */
  async updateListingMetrics(
    userId: string,
    listingId: string,
    action: 'created' | 'sold' | 'expired'
  ): Promise<void> {
    const updates: Record<string, any> = {};
    
    switch (action) {
      case 'created':
        updates.listingsCreated = prisma.Prisma.sql`listings_created + 1`;
        break;
      case 'sold':
        updates.listingsSold = prisma.Prisma.sql`listings_sold + 1`;
        break;
      case 'expired':
        // No specific metric, but record event
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      const setParts = Object.entries(updates).map(
        ([key, value]) => prisma.Prisma.sql`${prisma.Prisma.raw(key)} = ${value}`
      );
      
      await prisma.$executeRaw`
        UPDATE trust_scores
        SET ${prisma.Prisma.join(setParts, ', ')},
            listing_completion_rate = CASE 
              WHEN listings_created > 0 THEN (listings_sold::DECIMAL / listings_created) * 100
              ELSE 0
            END,
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }
    
    await this.recordTrustEvent({
      userId,
      eventType: `listing_${action}`,
      eventCategory: 'activity',
      eventAction: action,
      relatedEntityType: 'listing',
      relatedEntityId: listingId,
    });
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Update responsiveness metrics
   */
  async updateResponsivenessMetrics(
    userId: string,
    responseTimeMinutes: number,
    messageId: string
  ): Promise<void> {
    // Get current metrics
    const current = await prisma.$queryRaw<any[]>`
      SELECT avg_response_time_minutes, messages_received
      FROM trust_scores
      WHERE user_id = ${userId}
    `;
    
    const currentAvg = current[0]?.avg_response_time_minutes || 0;
    const messageCount = current[0]?.messages_received || 0;
    
    // Calculate new average
    const newAvg = ((currentAvg * messageCount) + responseTimeMinutes) / (messageCount + 1);
    
    await prisma.$executeRaw`
      UPDATE trust_scores
      SET avg_response_time_minutes = ${newAvg},
          messages_received = messages_received + 1,
          messages_sent = messages_sent + 1,
          response_rate = (messages_sent::DECIMAL / messages_received) * 100,
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    
    await this.recordTrustEvent({
      userId,
      eventType: 'message_response',
      eventCategory: 'activity',
      eventAction: 'responded',
      relatedEntityType: 'message',
      relatedEntityId: messageId,
      metadata: { responseTimeMinutes },
    });
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Record a flag against user
   */
  async recordFlag(
    userId: string,
    reason: string,
    reporterId: string,
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE trust_scores
      SET flags_received = flags_received + 1,
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    
    await this.recordTrustEvent({
      userId,
      eventType: 'flag_received',
      eventCategory: 'flag',
      eventAction: 'flagged',
      relatedEntityType: entityType,
      relatedEntityId: entityId,
      metadata: { reason, reporterId },
    });
    
    await this.calculateTrustScore(userId);
  }
  
  /**
   * Get trust leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM trust_leaderboard
      LIMIT ${limit}
    `;
  }
  
  /**
   * Get trust badges for a user
   */
  getTrustBadges(score: TrustScore): TrustBadge[] {
    const badges: TrustBadge[] = [];
    
    // Score level badges
    if (score.scoreLevel === 'elite') {
      badges.push({
        id: 'elite_seller',
        name: 'Elite Seller',
        description: 'Top-tier trusted seller',
        icon: '👑',
        scoreRequired: 800,
        color: '#FFD700',
      });
    } else if (score.scoreLevel === 'trusted') {
      badges.push({
        id: 'trusted_seller',
        name: 'Trusted Seller',
        description: 'Highly trusted seller',
        icon: '⭐',
        scoreRequired: 600,
        color: '#4A90E2',
      });
    } else if (score.scoreLevel === 'established') {
      badges.push({
        id: 'established_seller',
        name: 'Established Seller',
        description: 'Proven track record',
        icon: '✓',
        scoreRequired: 400,
        color: '#50C878',
      });
    }
    
    // Verification badges
    if (score.emailVerified && score.phoneVerified && score.idVerified) {
      badges.push({
        id: 'verified_identity',
        name: 'Verified Identity',
        description: 'Fully verified account',
        icon: '🛡️',
        scoreRequired: 0,
        color: '#50C878',
      });
    }
    
    // Transaction badges
    if (score.totalTransactions >= 100) {
      badges.push({
        id: 'power_seller',
        name: 'Power Seller',
        description: '100+ transactions',
        icon: '💪',
        scoreRequired: 0,
        color: '#FF6B6B',
      });
    }
    
    // Reputation badges
    if (score.averageRating && score.averageRating >= 4.8 && score.totalReviews >= 20) {
      badges.push({
        id: 'top_rated',
        name: 'Top Rated',
        description: '4.8+ stars, 20+ reviews',
        icon: '🌟',
        scoreRequired: 0,
        color: '#FFD700',
      });
    }
    
    // Responsiveness badge
    if (score.responsivenessScore >= 80) {
      badges.push({
        id: 'quick_responder',
        name: 'Quick Responder',
        description: 'Fast response times',
        icon: '⚡',
        scoreRequired: 0,
        color: '#FFA500',
      });
    }
    
    return badges;
  }
  
  /**
   * Get trust breakdown for display
   */
  getTrustBreakdown(score: TrustScore) {
    return {
      overall: {
        score: score.overallScore,
        level: score.scoreLevel,
        maxScore: 1000,
        percentage: (score.overallScore / 1000) * 100,
      },
      components: [
        {
          name: 'Verification',
          score: score.verificationScore,
          maxScore: 100,
          weight: '20%',
          description: 'Email, phone, ID verification',
          details: {
            email: score.emailVerified,
            phone: score.phoneVerified,
            id: score.idVerified,
            address: score.addressVerified,
            payment: score.paymentVerified,
          },
        },
        {
          name: 'Transactions',
          score: score.transactionScore,
          maxScore: 100,
          weight: '30%',
          description: 'Transaction history and success rate',
          details: {
            total: score.totalTransactions,
            successful: score.successfulTransactions,
            successRate:
              score.totalTransactions > 0
                ? ((score.successfulTransactions / score.totalTransactions) * 100).toFixed(1)
                : '0',
          },
        },
        {
          name: 'Reputation',
          score: score.reputationScore,
          maxScore: 100,
          weight: '25%',
          description: 'Ratings and reviews',
          details: {
            averageRating: score.averageRating?.toFixed(1) || 'N/A',
            totalReviews: score.totalReviews,
          },
        },
        {
          name: 'Activity',
          score: score.activityScore,
          maxScore: 100,
          weight: '15%',
          description: 'Platform engagement and history',
        },
        {
          name: 'Responsiveness',
          score: score.responsivenessScore,
          maxScore: 100,
          weight: '10%',
          description: 'Communication speed',
        },
      ],
      risk: {
        level: score.riskLevel,
        color:
          score.riskLevel === 'low'
            ? 'green'
            : score.riskLevel === 'medium'
            ? 'yellow'
            : score.riskLevel === 'high'
            ? 'orange'
            : 'red',
      },
      badges: this.getTrustBadges(score),
    };
  }
  
  /**
   * Check if user meets trust requirements for action
   */
  async checkTrustRequirement(
    userId: string,
    requirement: {
      minScore?: number;
      maxRiskLevel?: RiskLevel;
      requiredVerifications?: ('email' | 'phone' | 'id' | 'address' | 'payment')[];
    }
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const score = await this.getTrustScore(userId);
    if (!score) {
      return {
        allowed: false,
        reasons: ['Trust score not initialized'],
      };
    }
    
    const reasons: string[] = [];
    
    // Check minimum score
    if (requirement.minScore && score.overallScore < requirement.minScore) {
      reasons.push(`Minimum trust score of ${requirement.minScore} required (you have ${score.overallScore})`);
    }
    
    // Check risk level
    if (requirement.maxRiskLevel) {
      const riskLevels = ['unknown', 'low', 'medium', 'high', 'critical'];
      const userRiskIndex = riskLevels.indexOf(score.riskLevel);
      const maxRiskIndex = riskLevels.indexOf(requirement.maxRiskLevel);
      
      if (userRiskIndex > maxRiskIndex) {
        reasons.push(`Risk level too high (${score.riskLevel})`);
      }
    }
    
    // Check verifications
    if (requirement.requiredVerifications) {
      const verificationMap = {
        email: score.emailVerified,
        phone: score.phoneVerified,
        id: score.idVerified,
        address: score.addressVerified,
        payment: score.paymentVerified,
      };
      
      for (const verification of requirement.requiredVerifications) {
        if (!verificationMap[verification]) {
          reasons.push(`${verification.charAt(0).toUpperCase() + verification.slice(1)} verification required`);
        }
      }
    }
    
    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }
}

export const trustScoreService = new TrustScoreService();
