// Step 1: Image Analysis Layer
// Combines AWS Rekognition and Google Cloud Vision for comprehensive image analysis

import { logger } from './utils/logger';
import { rekognitionService } from './utils/api-clients/rekognition';
import { visionService } from './utils/api-clients/vision';
import type { Step1Result, UnifiedDetection } from './types';

export class ImageAnalysisStep {
  /**
   * Merge and unify results from both vision APIs
   */
  private unifyResults(
    rekognitionResult: any,
    visionResult: any
  ): UnifiedDetection {
    logger.info('STEP1', 'Unifying results from Rekognition and Vision');

    // Extract primary object
    let primaryObject = 'Unknown Product';
    
    // Try to get from Vision web entities first (most specific)
    if (visionResult.status === 'success' && visionResult.webEntities?.length > 0) {
      primaryObject = visionResult.webEntities[0].description;
    }
    // Fallback to Vision objects
    else if (visionResult.status === 'success' && visionResult.objects?.length > 0) {
      primaryObject = visionResult.objects[0].name;
    }
    // Fallback to Rekognition objects
    else if (rekognitionResult.status === 'success' && rekognitionResult.objects?.length > 0) {
      primaryObject = rekognitionResult.objects[0].name;
    }
    // Fallback to Rekognition labels
    else if (rekognitionResult.status === 'success' && rekognitionResult.labels?.length > 0) {
      primaryObject = rekognitionResult.labels[0].name;
    }

    // Determine category from labels
    let category = 'Other';
    const allLabels = [
      ...(rekognitionResult.labels || []).map((l: any) => l.name.toLowerCase()),
      ...(visionResult.labels || []).map((l: any) => l.description.toLowerCase()),
    ];

    // Category mapping
    const categoryMap: Record<string, string[]> = {
      'Electronics': ['phone', 'smartphone', 'laptop', 'computer', 'tablet', 'camera', 'headphones', 'electronics', 'mobile'],
      'Furniture': ['furniture', 'chair', 'table', 'desk', 'sofa', 'couch', 'bed', 'cabinet'],
      'Clothing': ['clothing', 'shirt', 'pants', 'dress', 'shoes', 'jacket', 'apparel', 'fashion'],
      'Home & Garden': ['plant', 'garden', 'home', 'decor', 'kitchen', 'appliance'],
      'Sports & Outdoors': ['sports', 'outdoor', 'bicycle', 'bike', 'fitness', 'exercise'],
      'Books & Media': ['book', 'media', 'cd', 'dvd', 'magazine', 'game'],
      'Toys & Games': ['toy', 'game', 'puzzle', 'doll', 'action figure'],
      'Automotive': ['car', 'vehicle', 'automotive', 'motorcycle', 'auto'],
    };

    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (allLabels.some(label => keywords.some(kw => label.includes(kw)))) {
        category = cat;
        break;
      }
    }

    // Extract detected text
    const detectedText: string[] = [];
    if (rekognitionResult.status === 'success' && rekognitionResult.text) {
      detectedText.push(...rekognitionResult.text.map((t: any) => t.detectedText));
    }
    if (visionResult.status === 'success' && visionResult.text && visionResult.text.length > 0) {
      // Vision API returns full text in first element, split by newlines
      const fullText = visionResult.text[0].description || '';
      detectedText.push(...fullText.split('\n').filter(t => t.trim()));
    }

    // Remove duplicates and filter short text
    const uniqueText = [...new Set(detectedText)]
      .filter(t => t.length > 2)
      .slice(0, 10); // Limit to 10 most relevant

    // Combine visual tags from both services
    const visualTags = new Set<string>();
    
    if (rekognitionResult.status === 'success' && rekognitionResult.labels) {
      rekognitionResult.labels.slice(0, 10).forEach((l: any) => {
        visualTags.add(l.name.toLowerCase());
      });
    }
    
    if (visionResult.status === 'success' && visionResult.labels) {
      visionResult.labels.slice(0, 10).forEach((l: any) => {
        visualTags.add(l.description.toLowerCase());
      });
    }

    // Calculate unified confidence
    const confidences: number[] = [];
    if (rekognitionResult.status === 'success' && rekognitionResult.confidence) {
      confidences.push(rekognitionResult.confidence);
    }
    if (visionResult.status === 'success' && visionResult.confidence) {
      confidences.push(visionResult.confidence);
    }
    
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

    logger.info('STEP1', 'Unification complete', {
      primaryObject,
      category,
      textCount: uniqueText.length,
      tagsCount: visualTags.size,
      confidence: avgConfidence.toFixed(2),
    });

    return {
      primaryObject,
      category,
      detectedText: uniqueText,
      visualTags: Array.from(visualTags),
      confidence: avgConfidence,
    };
  }

  /**
   * Execute Step 1: Image Analysis
   */
  async execute(imageUrl: string): Promise<Step1Result> {
    logger.startStep('STEP1');
    const startTime = Date.now();

    try {
      // Run both APIs in parallel for speed
      const [rekognitionResult, visionResult] = await Promise.all([
        rekognitionService.analyzeImage(imageUrl),
        visionService.analyzeImage(imageUrl),
      ]);

      // Check if at least one API succeeded
      if (rekognitionResult.status === 'error' && visionResult.status === 'error') {
        throw new Error('Both Rekognition and Vision APIs failed');
      }

      // Unify results
      const unified = this.unifyResults(rekognitionResult, visionResult);

      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP1', true);

      return {
        timestamp: new Date().toISOString(),
        duration_ms,
        sources: {
          rekognition: rekognitionResult,
          vision: visionResult,
        },
        unified,
      };

    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP1', false);
      
      throw new Error(`Step 1 failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const imageAnalysisStep = new ImageAnalysisStep();
