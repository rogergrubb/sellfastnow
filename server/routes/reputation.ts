// Reputation Routes - API Endpoints
// Location: server/routes/reputation.ts

import { Router } from "express";
import { reputationService } from "../services/reputationService";

const router = Router();

/**
 * GET /api/reputation/:userId
 * Get comprehensive reputation summary for a user
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await reputationService.getReputationSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error("Error fetching reputation summary:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch reputation summary"
    });
  }
});

/**
 * GET /api/reputation/:userId/score
 * Get reputation score for a user
 */
router.get("/:userId/score", async (req, res) => {
  try {
    const { userId } = req.params;
    const score = await reputationService.calculateReputationScore(userId);
    res.json(score);
  } catch (error) {
    console.error("Error calculating reputation score:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to calculate reputation score"
    });
  }
});

/**
 * GET /api/reputation/:userId/fraud-check
 * Check for fraud patterns
 */
router.get("/:userId/fraud-check", async (req, res) => {
  try {
    const { userId } = req.params;
    const fraudCheck = await reputationService.detectFraudPatterns(userId);
    res.json(fraudCheck);
  } catch (error) {
    console.error("Error checking fraud patterns:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check fraud patterns"
    });
  }
});

/**
 * GET /api/reputation/:userId/badges
 * Get badges earned by a user
 */
router.get("/:userId/badges", async (req, res) => {
  try {
    const { userId } = req.params;
    const { db } = await import("../db");
    const { userStatistics } = await import("../../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const stats = await db.query.userStatistics.findFirst({
      where: eq(userStatistics.userId, userId),
    });
    
    const badges = await reputationService.calculateBadges(userId, stats);
    res.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch badges"
    });
  }
});

export default router;

