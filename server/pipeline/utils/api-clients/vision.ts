// Google Cloud Vision Client

import vision from '@google-cloud/vision';
import { logger } from '../logger';
import type { VisionResult } from '../../types';

export class VisionService {
  private client: vision.ImageAnnotatorClient | null;
  private enabled: boolean;

  constructor() {
    // Check if Google Cloud credentials are configured
    this.enabled = !!(
      process.env.GOOGLE_CLOUD_PROJECT_ID ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );

    if (!this.enabled) {
      logger.warn('VISION', 'Google Cloud credentials not configured. Vision API will be skipped.');
      this.client = null;
      return;
    }

    try {
      this.client = new vision.ImageAnnotatorClient();
      logger.info('VISION', 'Google Cloud Vision client initialized');
    } catch (error: any) {
      logger.error('VISION', `Failed to initialize client: ${error.message}`);
      this.enabled = false;
      this.client = null;
    }
  }

  /**
   * Analyze image using Google Cloud Vision
   */
  async analyzeImage(imageUrl: string): Promise<VisionResult> {
    if (!this.enabled || !this.client) {
      return {
        status: 'error',
        error: 'Google Cloud Vision not configured',
      };
    }

    const startTime = Date.now();
    logger.info('VISION', `Analyzing image: ${imageUrl}`);

    try {
      // Perform multiple detections in parallel
      const [result] = await this.client.annotateImage({
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'WEB_DETECTION', maxResults: 10 },
        ],
      });

      // Extract labels
      const labels = result.labelAnnotations?.map(label => ({
        description: label.description || 'Unknown',
        score: label.score || 0,
      })) || [];

      // Extract objects
      const objects = result.localizedObjectAnnotations?.map(obj => ({
        name: obj.name || 'Unknown',
        score: obj.score || 0,
        boundingPoly: obj.boundingPoly,
      })) || [];

      // Extract text
      const text = result.textAnnotations?.map(t => ({
        description: t.description || '',
        locale: t.locale,
      })) || [];

      // Extract web entities (product identification)
      const webEntities = result.webDetection?.webEntities?.map(entity => ({
        entityId: entity.entityId,
        description: entity.description || 'Unknown',
        score: entity.score || 0,
      })) || [];

      // Calculate average confidence
      const allScores = [
        ...labels.map(l => l.score),
        ...objects.map(o => o.score),
        ...webEntities.map(e => e.score),
      ];
      const avgConfidence = allScores.length > 0
        ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
        : 0;

      const duration = Date.now() - startTime;
      logger.info('VISION', `Analysis complete`, {
        duration_ms: duration,
        labels: labels.length,
        objects: objects.length,
        text: text.length,
        webEntities: webEntities.length,
        confidence: avgConfidence.toFixed(2),
      });

      return {
        status: 'success',
        labels,
        objects,
        text,
        webEntities,
        confidence: avgConfidence,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('VISION', `Analysis failed: ${error.message}`, { duration_ms: duration });

      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const visionService = new VisionService();
