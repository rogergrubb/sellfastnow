// Trust System API Routes
// server/routes/trust.ts

import { Router } from "express";
import { db } from "../db";
import { trustScores, verifications, badges, trustEvents, reports } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  calculateTrustScore,
  getTrustLevel,
  getTrustLevelDisplay,
  awardBadge,
  applyPenalty,
  markPhoneVerified,
  markEmailVerified,
  markPaymentVerified,
  markIDVerified,
} from "../services/trustService";

const router = Router();

// ============================================
// GET USER TRUST SCORE
// ============================================
router.get("/score/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    let trustData = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, userId),
    });
    
    // If no trust score exists, calculate it
    if (!trustData) {
      const score = await calculateTrustScore(userId);
      trustData = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, userId),
      });
    }
    
    if (!trustData) {
      return res.status(404).json({ error: "Trust score not found" });
    }
    
    const levelDisplay = getTrustLevelDisplay(trustData.scoreLevel);
    
    res.json({
      overallScore: trustData.overallScore,
      scoreLevel: trustData.scoreLevel,
      levelDisplay,
      components: {
        verification: trustData.verificationScore,
        transaction: trustData.transactionScore,
        reputation: trustData.reputationScore,
        responsiveness: trustData.responsivenessScore,
      },
      metrics: {
        totalTransactions: trustData.totalTransactions,
        successfulTransactions: trustData.successfulTransactions,
        totalReviews: trustData.totalReviews,
        averageRating: trustData.averageRating,
        averageResponseTime: trustData.averageResponseTime,
      },
      lastCalculated: trustData.lastCalculated,
    });
  } catch (error) {
    console.error("Error fetching trust score:", error);
    res.status(500).json({ error: "Failed to fetch trust score" });
  }
});

// ============================================
// GET USER VERIFICATIONS
// ============================================
router.get("/verifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.userId, userId),
    });
    
    if (!verification) {
      return res.json({
        phoneVerified: false,
        emailVerified: false,
        idVerified: false,
        paymentVerified: false,
        socialVerified: false,
      });
    }
    
    res.json({
      phoneVerified: verification.phoneVerified,
      phoneVerifiedAt: verification.phoneVerifiedAt,
      emailVerified: verification.emailVerified,
      emailVerifiedAt: verification.emailVerifiedAt,
      idVerified: verification.idVerified,
      idVerifiedAt: verification.idVerifiedAt,
      idVerificationProvider: verification.idVerificationProvider,
      paymentVerified: verification.paymentVerified,
      paymentVerifiedAt: verification.paymentVerifiedAt,
      socialVerified: verification.socialVerified,
      socialVerifiedAt: verification.socialVerifiedAt,
      socialProvider: verification.socialProvider,
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
});

// ============================================
// GET USER BADGES
// ============================================
router.get("/badges/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userBadges = await db.query.badges.findMany({
      where: and(
        eq(badges.userId, userId),
        eq(badges.isActive, true)
      ),
      orderBy: [desc(badges.earnedAt)],
    });
    
    res.json(userBadges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
});

// ============================================
// RECALCULATE TRUST SCORE
// ============================================
router.post("/recalculate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const newScore = await calculateTrustScore(userId);
    
    res.json({
      success: true,
      newScore,
      message: "Trust score recalculated successfully",
    });
  } catch (error) {
    console.error("Error recalculating trust score:", error);
    res.status(500).json({ error: "Failed to recalculate trust score" });
  }
});

// ============================================
// MARK PHONE VERIFIED
// ============================================
router.post("/verify/phone", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    await markPhoneVerified(userId);
    
    res.json({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (error) {
    console.error("Error verifying phone:", error);
    res.status(500).json({ error: "Failed to verify phone" });
  }
});

// ============================================
// MARK EMAIL VERIFIED
// ============================================
router.post("/verify/email", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    await markEmailVerified(userId);
    
    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// ============================================
// MARK PAYMENT VERIFIED
// ============================================
router.post("/verify/payment", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    await markPaymentVerified(userId);
    
    res.json({
      success: true,
      message: "Payment method verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment method" });
  }
});

// ============================================
// MARK ID VERIFIED
// ============================================
router.post("/verify/id", async (req, res) => {
  try {
    const { userId, provider } = req.body;
    
    if (!userId || !provider) {
      return res.status(400).json({ error: "userId and provider are required" });
    }
    
    await markIDVerified(userId, provider);
    
    res.json({
      success: true,
      message: "ID verified successfully",
    });
  } catch (error) {
    console.error("Error verifying ID:", error);
    res.status(500).json({ error: "Failed to verify ID" });
  }
});

// ============================================
// SUBMIT REPORT
// ============================================
router.post("/report", async (req, res) => {
  try {
    const { reporterId, reportedUserId, reportType, reportReason, evidence } = req.body;
    
    if (!reporterId || !reportedUserId || !reportType || !reportReason) {
      return res.status(400).json({
        error: "reporterId, reportedUserId, reportType, and reportReason are required",
      });
    }
    
    const report = await db.insert(reports).values({
      reporterId,
      reportedUserId,
      reportType,
      reportReason,
      evidence: evidence || null,
      status: "pending",
    }).returning();
    
    res.json({
      success: true,
      reportId: report[0].id,
      message: "Report submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// ============================================
// GET TRUST HISTORY
// ============================================
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = "20" } = req.query;
    
    const history = await db.query.trustEvents.findMany({
      where: eq(trustEvents.userId, userId),
      orderBy: [desc(trustEvents.createdAt)],
      limit: parseInt(limit as string),
    });
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching trust history:", error);
    res.status(500).json({ error: "Failed to fetch trust history" });
  }
});

// ============================================
// AWARD BADGE (Admin only - add auth middleware)
// ============================================
router.post("/badge/award", async (req, res) => {
  try {
    const { userId, badgeType } = req.body;
    
    if (!userId || !badgeType) {
      return res.status(400).json({ error: "userId and badgeType are required" });
    }
    
    await awardBadge(userId, badgeType);
    
    res.json({
      success: true,
      message: `Badge ${badgeType} awarded successfully`,
    });
  } catch (error) {
    console.error("Error awarding badge:", error);
    res.status(500).json({ error: "Failed to award badge" });
  }
});

// ============================================
// APPLY PENALTY (Admin only - add auth middleware)
// ============================================
router.post("/penalty/apply", async (req, res) => {
  try {
    const { userId, penaltyType, reason, scorePenalty, expiresAt } = req.body;
    
    if (!userId || !penaltyType || !reason || scorePenalty === undefined) {
      return res.status(400).json({
        error: "userId, penaltyType, reason, and scorePenalty are required",
      });
    }
    
    await applyPenalty(
      userId,
      penaltyType,
      reason,
      scorePenalty,
      expiresAt ? new Date(expiresAt) : undefined
    );
    
    res.json({
      success: true,
      message: "Penalty applied successfully",
    });
  } catch (error) {
    console.error("Error applying penalty:", error);
    res.status(500).json({ error: "Failed to apply penalty" });
  }
});

export default router;
