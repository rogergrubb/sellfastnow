// Usage Monitoring API Routes

import { Router, Request, Response } from 'express';
import { usageMonitor } from '../pipeline/utils/usage-monitor';
import { cacheManager } from '../pipeline/utils/cache';

const router = Router();

/**
 * GET /api/usage/stats
 * Get usage statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { provider, period } = req.query;

    const stats = usageMonitor.getStats(
      provider as string | undefined,
      (period as 'day' | 'month') || 'day'
    );

    res.json({
      period: period || 'day',
      stats,
    });
  } catch (error: any) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/usage/report
 * Get comprehensive usage report
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const report = usageMonitor.getReport();

    // Add cache stats
    const cacheStats = await cacheManager.getStats();

    res.json({
      ...report,
      cache: cacheStats,
    });
  } catch (error: any) {
    console.error('Usage report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/usage/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cacheManager.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/usage/cache/clear
 * Clear cache by prefix
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    const { prefix } = req.body;

    if (!prefix) {
      return res.status(400).json({ error: 'prefix is required' });
    }

    await cacheManager.clearPrefix(prefix);

    res.json({
      success: true,
      message: `Cache cleared for prefix: ${prefix}`,
    });
  } catch (error: any) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
