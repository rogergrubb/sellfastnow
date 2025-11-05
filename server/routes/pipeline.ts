// Pipeline API Routes

import { Router, Request, Response } from 'express';
import { pipeline } from '../pipeline';
import type { PipelineOptions, BatchRequest } from '../pipeline/types';

const router = Router();

/**
 * POST /api/pipeline/analyze
 * Process a single image through the full pipeline
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { image_url, options } = req.body as {
      image_url: string;
      options?: PipelineOptions;
    };

    if (!image_url) {
      return res.status(400).json({
        error: 'image_url is required',
      });
    }

    // Clear previous logs
    pipeline.clearLogs();

    // Process image
    const result = await pipeline.processImage(image_url, options);

    // Get logs
    const logs = pipeline.getLogs();

    res.json({
      ...result,
      logs,
    });

  } catch (error: any) {
    console.error('Pipeline API error:', error);
    res.status(500).json({
      error: error.message,
      logs: pipeline.getLogs(),
    });
  }
});

/**
 * POST /api/pipeline/analyze-batch
 * Process multiple images in batch
 */
router.post('/analyze-batch', async (req: Request, res: Response) => {
  try {
    const batchRequest = req.body as BatchRequest;

    if (!batchRequest.image_urls || !Array.isArray(batchRequest.image_urls)) {
      return res.status(400).json({
        error: 'image_urls array is required',
      });
    }

    if (batchRequest.image_urls.length === 0) {
      return res.status(400).json({
        error: 'image_urls array cannot be empty',
      });
    }

    if (batchRequest.image_urls.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 images per batch',
      });
    }

    // Clear previous logs
    pipeline.clearLogs();

    // Process batch
    const result = await pipeline.processBatch(batchRequest);

    // Get logs
    const logs = pipeline.getLogs();

    res.json({
      ...result,
      logs,
    });

  } catch (error: any) {
    console.error('Pipeline batch API error:', error);
    res.status(500).json({
      error: error.message,
      logs: pipeline.getLogs(),
    });
  }
});

/**
 * GET /api/pipeline/health
 * Check pipeline health and API availability
 */
router.get('/health', async (req: Request, res: Response) => {
  const { rekognitionService } = await import('../pipeline/utils/api-clients/rekognition');
  const { visionService } = await import('../pipeline/utils/api-clients/vision');
  const { amazonProductService } = await import('../pipeline/utils/api-clients/amazon-product');
  const { googleShoppingService } = await import('../pipeline/utils/api-clients/google-shopping');
  const { ebayService } = await import('../pipeline/utils/api-clients/ebay');

  res.json({
    status: 'healthy',
    version: '1.0.0',
    services: {
      rekognition: rekognitionService.isEnabled(),
      vision: visionService.isEnabled(),
      amazon_product: amazonProductService.isEnabled(),
      google_shopping: googleShoppingService.isEnabled(),
      ebay: ebayService.isEnabled(),
    },
  });
});

export default router;
