// Trust System API Routes
// Express routes for trust score management

import { Router, Request, Response } from 'express';
import { trustScoreService } from '../services/trustScoreService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/trust/:userId
 * Get public trust score for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const score = await trustScoreService.getTrustScore(userId);
    
    if (!score) {
      return res.status(404).json({
        success: false,
        error: 'Trust score not found',
      });
    }
    
    // Return public trust data
    res.json({
      success: true,
      data: {
        userId: score.userId,
        overallScore: score.overallScore,
        scoreLevel: score.scoreLevel,
        riskLevel: score.riskLevel,
        badges: trustScoreService.getTrustBadges(score),
        
        // Public metrics
        totalTransactions: score.totalTransactions,
        successfulTransactions: score.successfulTransactions,
        averageRating: score.averageRating,
        totalReviews: score.totalReviews,
        
        // Public verification status
        emailVerified: score.emailVerified,
        phoneVerified: score.phoneVerified,
        idVerified: score.idVerified,
        
        lastUpdated: score.lastCalculatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching trust score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trust score',
    });
  }
});

/**
 * GET /api/trust/:userId/badges
 * Get trust badges for a user
 */
router.get('/:userId/badges', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const score = await trustScoreService.getTrustScore(userId);
    
    if (!score) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    const badges = trustScoreService.getTrustBadges(score);
    
    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badges',
    });
  }
});

/**
 * GET /api/trust/leaderboard
 * Get trust score leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const leaderboard = await trustScoreService.getLeaderboard(limit);
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

/**
 * GET /api/trust/me
 * Get detailed trust score for authenticated user
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const score = await trustScoreService.getTrustScore(userId);
    
    if (!score) {
      return res.status(404).json({
        success: false,
        error: 'Trust score not found',
      });
    }
    
    const breakdown = trustScoreService.getTrustBreakdown(score);
    
    res.json({
      success: true,
      data: {
        ...score,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching own trust score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trust score',
    });
  }
});

/**
 * GET /api/trust/me/breakdown
 * Get detailed breakdown of trust score components
 */
router.get('/me/breakdown', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const score = await trustScoreService.getTrustScore(userId);
    
    if (!score) {
      return res.status(404).json({
        success: false,
        error: 'Trust score not found',
      });
    }
    
    const breakdown = trustScoreService.getTrustBreakdown(score);
    
    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown',
    });
  }
});

/**
 * POST /api/trust/recalculate
 * Manually trigger trust score recalculation
 */
router.post('/recalculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const newScore = await trustScoreService.calculateTrustScore(userId);
    
    res.json({
      success: true,
      data: {
        score: newScore,
        message: 'Trust score recalculated successfully',
      },
    });
  } catch (error) {
    console.error('Error recalculating trust score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate trust score',
    });
  }
});

/**
 * POST /api/trust/verify/:type
 * Request verification for a specific type
 */
router.post('/verify/:type', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type } = req.params;
    const { value } = req.body;
    
    const validTypes = ['email', 'phone', 'id', 'address', 'payment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification type',
      });
    }
    
    // Here you would integrate with verification services
    // For now, we'll just update the status
    await trustScoreService.updateVerification(
      userId,
      type as any,
      true
    );
    
    res.json({
      success: true,
      message: `${type} verification initiated`,
    });
  } catch (error) {
    console.error('Error initiating verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate verification',
    });
  }
});

/**
 * GET /api/trust/requirements/:action
 * Check if user meets requirements for an action
 */
router.get('/requirements/:action', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { action } = req.params;
    
    // Define requirements for different actions
    const requirements: Record<string, any> = {
      create_listing: {
        minScore: 0,
        requiredVerifications: ['email'],
      },
      create_professional_listing: {
        minScore: 200,
        requiredVerifications: ['email', 'phone', 'id'],
      },
      accept_crypto_payments: {
        minScore: 400,
        maxRiskLevel: 'medium',
        requiredVerifications: ['email', 'phone', 'id'],
      },
      become_professional: {
        minScore: 300,
        maxRiskLevel: 'medium',
        requiredVerifications: ['email', 'phone', 'id', 'address'],
      },
      high_value_transaction: {
        minScore: 500,
        maxRiskLevel: 'low',
        requiredVerifications: ['email', 'phone', 'id'],
      },
    };
    
    const requirement = requirements[action];
    if (!requirement) {
      return res.status(400).json({
        success: false,
        error: 'Unknown action',
      });
    }
    
    const result = await trustScoreService.checkTrustRequirement(userId, requirement);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check requirements',
    });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * POST /api/trust/admin/flag
 * Admin: Record a flag against a user
 */
router.post('/admin/flag', authMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { userId, reason, entityType, entityId } = req.body;
    
    // Check if user is admin (implement your admin check)
    // if (!(req as any).user.isAdmin) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    await trustScoreService.recordFlag(userId, reason, adminId, entityType, entityId);
    
    res.json({
      success: true,
      message: 'Flag recorded successfully',
    });
  } catch (error) {
    console.error('Error recording flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record flag',
    });
  }
});

/**
 * POST /api/trust/admin/recalculate-all
 * Admin: Recalculate all trust scores (use with caution)
 */
router.post('/admin/recalculate-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    // if (!(req as any).user.isAdmin) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }
    
    // This should be run as a background job
    res.json({
      success: true,
      message: 'Trust score recalculation job initiated',
    });
  } catch (error) {
    console.error('Error initiating recalculation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate recalculation',
    });
  }
});

export default router;
