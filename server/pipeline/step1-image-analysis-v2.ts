// Step 1: Image Analysis Layer (v2 - Provider-based)
// Uses provider registry with Google Cloud as primary, Gemini as backup

import { logger } from './utils/logger';
import { usageMonitor } from './utils/usage-monitor';
import { ProviderRegistry, VisionProvider } from './providers/base';
import { GoogleCloudVisionProvider } from './providers/vision/google-cloud';
import { GeminiVisionProvider } from './providers/vision/gemini';
import { AWSRekognitionProvider } from './providers/vision/aws-rekognition';
import { CachedVisionProvider } from './providers/vision/cached';
import type { Step1Result } from './types';

export class ImageAnalysisStepV2 {
  private visionRegistry: ProviderRegistry<VisionProvider>;

  constructor() {
    // Initialize provider registry
    this.visionRegistry = new ProviderRegistry<VisionProvider>();

    // Register providers (wrapped with caching)
    // Priority: Google Cloud (1) > Gemini (2) > AWS (3)
    this.visionRegistry.register(new CachedVisionProvider(new GoogleCloudVisionProvider()));
    this.visionRegistry.register(new CachedVisionProvider(new GeminiVisionProvider()));
    this.visionRegistry.register(new CachedVisionProvider(new AWSRekognitionProvider()));

    logger.info('STEP1', 'Image analysis providers initialized');
  }

  /**
   * Unify results from multiple providers
   */
  private unifyResults(results: Array<{ provider: string; result: any }>): any {
    logger.info('STEP1', 'Unifying results from vision providers');

    // Collect all data
    const allObjects: any[] = [];
    const allLabels: any[] = [];
    const allText: any[] = [];
    const allWebEntities: any[] = [];
    let totalConfidence = 0;
    let successCount = 0;

    for (const { provider, result } of results) {
      if (result.status !== 'success') continue;
      successCount++;

      if (result.objects) allObjects.push(...result.objects);
      if (result.labels) allLabels.push(...result.labels);
      if (result.text) allText.push(...result.text);
      if (result.webEntities) allWebEntities.push(...result.webEntities);
      if (result.confidence) totalConfidence += result.confidence;
    }

    if (successCount === 0) {
      throw new Error('All vision providers failed');
    }

    // Find primary object (highest confidence)
    const primaryObject = allObjects.length > 0
      ? allObjects.reduce((max, obj) => obj.confidence > max.confidence ? obj : max, allObjects[0]).name
      : (allLabels.length > 0 ? allLabels[0].name : 'Unknown Product');

    // Deduplicate and sort text
    const uniqueText = [...new Set(allText.map(t => t.detectedText))];

    // Deduplicate and sort labels
    const labelMap = new Map<string, number>();
    for (const label of allLabels) {
      const existing = labelMap.get(label.name) || 0;
      labelMap.set(label.name, Math.max(existing, label.confidence));
    }
    const uniqueLabels = Array.from(labelMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // Determine category
    const category = this.determineCategory(primaryObject, uniqueLabels);

    // Calculate average confidence
    const avgConfidence = totalConfidence / successCount;

    logger.info('STEP1', 'Unification complete', {
      primaryObject,
      category,
      textCount: uniqueText.length,
      tagsCount: uniqueLabels.length,
      confidence: avgConfidence.toFixed(2),
    });

    return {
      primaryObject,
      category,
      detectedText: uniqueText,
      visualTags: uniqueLabels,
      confidence: avgConfidence,
      webEntities: allWebEntities.slice(0, 10),
    };
  }

  /**
   * Determine product category from labels
   */
  private determineCategory(primaryObject: string, labels: string[]): string {
    const text = [primaryObject, ...labels].join(' ').toLowerCase();

    const categories = [
      { name: 'Electronics', keywords: ['phone', 'computer', 'laptop', 'tablet', 'camera', 'headphone', 'speaker', 'tv', 'monitor', 'electronic'] },
      { name: 'Furniture', keywords: ['chair', 'table', 'desk', 'sofa', 'bed', 'furniture', 'cabinet', 'shelf'] },
      { name: 'Clothing', keywords: ['shirt', 'pants', 'dress', 'shoe', 'jacket', 'clothing', 'apparel', 'fashion'] },
      { name: 'Home & Garden', keywords: ['kitchen', 'garden', 'home', 'decor', 'appliance', 'tool'] },
      { name: 'Sports & Outdoors', keywords: ['sport', 'fitness', 'outdoor', 'bike', 'exercise', 'athletic', 'trainer', 'running'] },
      { name: 'Books & Media', keywords: ['book', 'magazine', 'media', 'dvd', 'cd', 'vinyl'] },
      { name: 'Toys & Games', keywords: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'lego'] },
      { name: 'Automotive', keywords: ['car', 'auto', 'vehicle', 'tire', 'automotive'] },
    ];

    for (const cat of categories) {
      if (cat.keywords.some(keyword => text.includes(keyword))) {
        return cat.name;
      }
    }

    return 'Other';
  }

  /**
   * Execute Step 1: Image Analysis with provider fallback
   */
  async execute(imageUrl: string): Promise<Step1Result> {
    logger.startStep('STEP1');
    const startTime = Date.now();

    try {
      const enabledProviders = this.visionRegistry.getEnabledProviders();
      
      if (enabledProviders.length === 0) {
        throw new Error('No vision providers available');
      }

      logger.info('STEP1', `Available providers: ${enabledProviders.map(p => p.name).join(', ')}`);

      const results: Array<{ provider: string; result: any }> = [];
      let primarySuccess = false;

      // Try providers in priority order
      for (const provider of enabledProviders) {
        try {
          logger.info('STEP1', `Trying provider: ${provider.name}`);
          
          const result = await provider.analyzeImage(imageUrl);
          
          // Record usage
          await usageMonitor.recordUsage(provider.name, 'analyzeImage', false);
          
          results.push({ provider: provider.name, result });

          if (result.status === 'success') {
            primarySuccess = true;
            logger.info('STEP1', `Provider ${provider.name} succeeded`);
            
            // If primary provider succeeds, we can stop
            // But we could also try secondary providers for better accuracy
            break;
          } else {
            logger.warn('STEP1', `Provider ${provider.name} failed: ${result.error}`);
          }
        } catch (error: any) {
          logger.error('STEP1', `Provider ${provider.name} error: ${error.message}`);
        }
      }

      if (!primarySuccess) {
        throw new Error('All vision providers failed');
      }

      // Unify results
      const unified = this.unifyResults(results);

      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP1', true);

      // Build response
      const response: Step1Result = {
        timestamp: new Date().toISOString(),
        duration_ms,
        sources: {} as any,
        unified,
      };

      // Add individual provider results
      for (const { provider, result } of results) {
        (response.sources as any)[provider] = result;
      }

      return response;

    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP1', false);
      throw new Error(`Step 1 failed: ${error.message}`);
    }
  }

  /**
   * Get available providers
   */
  getProviders(): VisionProvider[] {
    return this.visionRegistry.getAllProviders();
  }
}

// Export singleton instance
export const imageAnalysisStepV2 = new ImageAnalysisStepV2();
