// Trust Service - Score Calculation & Management
// server/services/trustService.ts

import { db } from "../db";
import { trustScores, verifications, badges, trustEvents, penalties } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================
// TRUST SCORE CALCULATION
// ============================================

interface TrustScoreComponents {
  verification: number;      // 0-25 points
  transaction: number;        // 0-25 points
  reputation: number;         // 0-25 points
  responsiveness: number;     // 0-25 points
}

/**
 * Calculate overall trust score for a user
 * Total: 0-100 points
 */
export async function calculateTrustScore(userId: string): Promise<number> {
  const components = await calculateScoreComponents(userId);
  
  const totalScore = 
    components.verification +
    components.transaction +
    components.reputation +
    components.responsiveness;
  
  // Apply any active penalties
  const activePenalties = await getActivePenalties(userId);
  const penaltySum = activePenalties.reduce((sum, p) => sum + (p.scorePenalty || 0), 0);
  
  const finalScore = Math.max(0, Math.min(100, totalScore - penaltySum));
  
  // Update database
  await updateTrustScore(userId, finalScore, components);
  
  // Log the event
  await logTrustEvent(userId, "score_recalculated", "neutral", {
    components,
    penalties: penaltySum,
    finalScore,
  });
  
  return finalScore;
}

/**
 * Calculate individual score components
 */
async function calculateScoreComponents(userId: string): Promise<TrustScoreComponents> {
  const [verification, transaction, reputation, responsiveness] = await Promise.all([
    calculateVerificationScore(userId),
    calculateTransactionScore(userId),
    calculateReputationScore(userId),
    calculateResponsivenessScore(userId),
  ]);
  
  return { verification, transaction, reputation, responsiveness };
}

// ============================================
// VERIFICATION SCORE (0-25 points)
// ============================================
async function calculateVerificationScore(userId: string): Promise<number> {
  const verification = await db.query.verifications.findFirst({
    where: eq(verifications.userId, userId),
  });
  
  if (!verification) return 0;
  
  let score = 0;
  
  // Phone verified: 5 points
  if (verification.phoneVerified) score += 5;
  
  // Email verified: 5 points
  if (verification.emailVerified) score += 5;
  
  // Payment method on file: 5 points
  if (verification.paymentVerified) score += 5;
  
  // Social account connected: 3 points
  if (verification.socialVerified) score += 3;
  
  // Government ID verified: 7 points (highest value)
  if (verification.idVerified) score += 7;
  
  return Math.min(25, score);
}

// ============================================
// TRANSACTION SCORE (0-25 points)
// ============================================
async function calculateTransactionScore(userId: string): Promise<number> {
  const trustData = await db.query.trustScores.findFirst({
    where: eq(trustScores.userId, userId),
  });
  
  if (!trustData) return 0;
  
  const totalTxns = trustData.totalTransactions || 0;
  const successfulTxns = trustData.successfulTransactions || 0;
  const disputedTxns = trustData.disputedTransactions || 0;
  
  if (totalTxns === 0) return 0;
  
  // Calculate success rate
  const successRate = successfulTxns / totalTxns;
  
  // Calculate dispute rate
  const disputeRate = disputedTxns / totalTxns;
  
  // Base score from success rate (0-15 points)
  let score = successRate * 15;
  
  // Bonus for volume (0-10 points)
  // 1 transaction = 1 point, capped at 10
  const volumeBonus = Math.min(10, totalTxns);
  score += volumeBonus;
  
  // Penalty for disputes (-5 points max)
  const disputePenalty = disputeRate * 5;
  score -= disputePenalty;
  
  return Math.max(0, Math.min(25, score));
}

// ============================================
// REPUTATION SCORE (0-25 points)
// ============================================
async function calculateReputationScore(userId: string): Promise<number> {
  const trustData = await db.query.trustScores.findFirst({
    where: eq(trustScores.userId, userId),
  });
  
  if (!trustData) return 0;
  
  const totalReviews = trustData.totalReviews || 0;
  const avgRating = trustData.averageRating ? parseFloat(trustData.averageRating) : 0;
  const positiveReviews = trustData.positiveReviews || 0;
  const negativeReviews = trustData.negativeReviews || 0;
  
  if (totalReviews === 0) return 0;
  
  // Average rating score (0-15 points)
  // 5.0 rating = 15 points, 4.0 rating = 12 points, etc.
  const ratingScore = (avgRating / 5.0) * 15;
  
  // Volume bonus (0-5 points)
  // 10+ reviews = 5 points, scales linearly
  const volumeBonus = Math.min(5, (totalReviews / 10) * 5);
  
  // Positive/negative ratio (0-5 points)
  const positiveRate = positiveReviews / totalReviews;
  const ratioBonus = positiveRate * 5;
  
  const score = ratingScore + volumeBonus + ratioBonus;
  
  return Math.max(0, Math.min(25, score));
}

// ============================================
// RESPONSIVENESS SCORE (0-25 points)
// ============================================
async function calculateResponsivenessScore(userId: string): Promise<number> {
  const trustData = await db.query.trustScores.findFirst({
    where: eq(trustScores.userId, userId),
  });
  
  if (!trustData) return 0;
  
  const avgResponseTime = trustData.averageResponseTime || 0; // in minutes
  const totalMessages = trustData.totalMessages || 0;
  
  if (totalMessages === 0) return 0;
  
  // Response time score (0-20 points)
  // < 5 min = 20 points
  // < 15 min = 15 points
  // < 30 min = 10 points
  // < 60 min = 5 points
  // > 60 min = 0 points
  let timeScore = 0;
  if (avgResponseTime < 5) timeScore = 20;
  else if (avgResponseTime < 15) timeScore = 15;
  else if (avgResponseTime < 30) timeScore = 10;
  else if (avgResponseTime < 60) timeScore = 5;
  
  // Activity bonus (0-5 points)
  // 50+ messages = 5 points, scales linearly
  const activityBonus = Math.min(5, (totalMessages / 50) * 5);
  
  const score = timeScore + activityBonus;
  
  return Math.max(0, Math.min(25, score));
}

// ============================================
// TRUST SCORE LEVELS
// ============================================
export function getTrustLevel(score: number): string {
  if (score >= 80) return "elite";
  if (score >= 60) return "trusted";
  if (score >= 40) return "established";
  if (score >= 20) return "building";
  return "new";
}

export function getTrustLevelDisplay(level: string): { label: string; color: string; emoji: string } {
  const displays = {
    elite: { label: "Elite", color: "gold", emoji: "🏆" },
    trusted: { label: "Trusted", color: "green", emoji: "✅" },
    established: { label: "Established", color: "blue", emoji: "🔵" },
    building: { label: "Building Trust", color: "yellow", emoji: "🟡" },
    new: { label: "New User", color: "gray", emoji: "⚪" },
  };
  
  return displays[level as keyof typeof displays] || displays.new;
}

// ============================================
// DATABASE UPDATES
// ============================================
async function updateTrustScore(
  userId: string,
  overallScore: number,
  components: TrustScoreComponents
) {
  const level = getTrustLevel(overallScore);
  
  await db.insert(trustScores)
    .values({
      userId,
      overallScore,
      scoreLevel: level,
      verificationScore: Math.round(components.verification),
      transactionScore: Math.round(components.transaction),
      reputationScore: Math.round(components.reputation),
      responsivenessScore: Math.round(components.responsiveness),
      lastCalculated: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: trustScores.userId,
      set: {
        overallScore,
        scoreLevel: level,
        verificationScore: Math.round(components.verification),
        transactionScore: Math.round(components.transaction),
        reputationScore: Math.round(components.reputation),
        responsivenessScore: Math.round(components.responsiveness),
        lastCalculated: new Date(),
        updatedAt: new Date(),
      },
    });
}

// ============================================
// BADGE MANAGEMENT
// ============================================
export async function awardBadge(userId: string, badgeType: string) {
  const badgeConfigs = {
    phone_verified: { name: "Phone Verified", icon: "✓", color: "blue" },
    email_verified: { name: "Email Verified", icon: "✓", color: "blue" },
    payment_verified: { name: "Payment Verified", icon: "💳", color: "green" },
    id_verified: { name: "ID Verified", icon: "🆔", color: "gold" },
    power_seller: { name: "Power Seller", icon: "⚡", color: "purple" },
    trusted_buyer: { name: "Trusted Buyer", icon: "🎯", color: "blue" },
    fast_responder: { name: "Fast Responder", icon: "⚡", color: "orange" },
    top_rated: { name: "Top Rated", icon: "⭐", color: "gold" },
  };
  
  const config = badgeConfigs[badgeType as keyof typeof badgeConfigs];
  if (!config) return;
  
  // Check if badge already exists
  const existing = await db.query.badges.findFirst({
    where: and(
      eq(badges.userId, userId),
      eq(badges.badgeType, badgeType),
      eq(badges.isActive, true)
    ),
  });
  
  if (existing) return; // Badge already awarded
  
  await db.insert(badges).values({
    userId,
    badgeType,
    badgeName: config.name,
    badgeIcon: config.icon,
    badgeColor: config.color,
  });
  
  await logTrustEvent(userId, "badge_awarded", "positive", { badgeType, badgeName: config.name });
}

export async function revokeBadge(userId: string, badgeType: string) {
  await db.update(badges)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(badges.userId, userId),
      eq(badges.badgeType, badgeType)
    ));
  
  await logTrustEvent(userId, "badge_revoked", "negative", { badgeType });
}

// ============================================
// PENALTY MANAGEMENT
// ============================================
export async function applyPenalty(
  userId: string,
  penaltyType: string,
  reason: string,
  scorePenalty: number,
  expiresAt?: Date
) {
  await db.insert(penalties).values({
    userId,
    penaltyType,
    reason,
    scorePenalty,
    expiresAt,
  });
  
  await logTrustEvent(userId, "penalty_applied", "negative", {
    penaltyType,
    reason,
    scorePenalty,
  });
  
  // Recalculate score
  await calculateTrustScore(userId);
}

async function getActivePenalties(userId: string) {
  return await db.query.penalties.findMany({
    where: and(
      eq(penalties.userId, userId),
      eq(penalties.isActive, true)
    ),
  });
}

// ============================================
// TRUST EVENTS (Audit Log)
// ============================================
async function logTrustEvent(
  userId: string,
  eventType: string,
  eventCategory: string,
  metadata?: any
) {
  const currentScore = await db.query.trustScores.findFirst({
    where: eq(trustScores.userId, userId),
  });
  
  await db.insert(trustEvents).values({
    userId,
    eventType,
    eventCategory,
    scoreAfter: currentScore?.overallScore || 0,
    metadata,
  });
}

// ============================================
// VERIFICATION HELPERS
// ============================================
export async function markPhoneVerified(userId: string) {
  await db.insert(verifications)
    .values({
      userId,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: verifications.userId,
      set: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
  await awardBadge(userId, "phone_verified");
  await calculateTrustScore(userId);
}

export async function markEmailVerified(userId: string) {
  await db.insert(verifications)
    .values({
      userId,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: verifications.userId,
      set: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
  await awardBadge(userId, "email_verified");
  await calculateTrustScore(userId);
}

export async function markPaymentVerified(userId: string) {
  await db.insert(verifications)
    .values({
      userId,
      paymentVerified: true,
      paymentVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: verifications.userId,
      set: {
        paymentVerified: true,
        paymentVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
  await awardBadge(userId, "payment_verified");
  await calculateTrustScore(userId);
}

export async function markIDVerified(userId: string, provider: string) {
  await db.insert(verifications)
    .values({
      userId,
      idVerified: true,
      idVerifiedAt: new Date(),
      idVerificationProvider: provider,
    })
    .onConflictDoUpdate({
      target: verifications.userId,
      set: {
        idVerified: true,
        idVerifiedAt: new Date(),
        idVerificationProvider: provider,
        updatedAt: new Date(),
      },
    });
  
  await awardBadge(userId, "id_verified");
  await calculateTrustScore(userId);
}
