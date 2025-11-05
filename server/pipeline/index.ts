// Main Pipeline Orchestrator
// Coordinates all 3 steps and produces final output

import { logger } from './utils/logger';
import { imageAnalysisStepV2 } from './step1-image-analysis-v2';
import { productEnrichmentStepV2 } from './step2-enrichment-v2';
import { aiSynthesisStep } from './step3-synthesis';
import type { PipelineOptions, PipelineResult, FinalProduct, BatchRequest, BatchResult } from './types';

export class ProductImagePipeline {
  /**
   * Build final product output from all steps
   */
  private buildFinalProduct(
    step1Result: any,
    step2Result: any,
    step3Result: any
  ): FinalProduct {
    const { generated } = step3Result;
    const { unified: pricing } = step2Result;

    return {
      title: generated.title,
      description: generated.description,
      short_description: generated.short_description,
      category: generated.category,
      tags: generated.tags,
      pricing: {
        retail_price: pricing.retail_price,
        used_price_estimate: pricing.used_price_estimate,
        currency: 'USD',
      },
      seo: generated.seo,
      identifiers: pricing.product_identifiers,
      confidence: (step1Result.unified.confidence + pricing.price_confidence + generated.confidence) / 3,
    };
  }

  /**
   * Process a single image through the full pipeline
   */
  async processImage(
    imageUrl: string,
    options: PipelineOptions = {}
  ): Promise<PipelineResult> {
    const pipelineStartTime = Date.now();
    
    logger.info('PIPELINE', `Starting pipeline for image: ${imageUrl}`);
    logger.info('PIPELINE', `Options:`, options);

    try {
      // Step 1: Image Analysis
      let step1Result;
      if (options.skipStep1) {
        logger.info('PIPELINE', 'Step 1 skipped by option');
        step1Result = null;
      } else {
        step1Result = await imageAnalysisStepV2.execute(imageUrl);
      }

      // Step 2: Product Enrichment
      let step2Result;
      if (options.skipStep2 || !step1Result) {
        logger.info('PIPELINE', 'Step 2 skipped');
        step2Result = null;
      } else {
        step2Result = await productEnrichmentStepV2.execute(step1Result, options.skipPricing);
      }

      // Step 3: AI Synthesis
      let step3Result;
      if (options.skipStep3 || !step1Result || !step2Result) {
        logger.info('PIPELINE', 'Step 3 skipped');
        step3Result = null;
      } else {
        step3Result = await aiSynthesisStep.execute(
          step1Result,
          step2Result,
          options.llmModel
        );
      }

      // Build final product
      let final_product: FinalProduct | undefined;
      if (step1Result && step2Result && step3Result) {
        final_product = this.buildFinalProduct(step1Result, step2Result, step3Result);
      }

      const total_duration_ms = Date.now() - pipelineStartTime;

      logger.info('PIPELINE', `Pipeline complete`, {
        total_duration_ms,
        status: 'success',
      });

      return {
        pipeline_version: '1.0.0',
        image_url: imageUrl,
        processed_at: new Date().toISOString(),
        total_duration_ms,
        status: 'success',
        step1: step1Result || undefined,
        step2: step2Result || undefined,
        step3: step3Result || undefined,
        final_product,
      };

    } catch (error: any) {
      const total_duration_ms = Date.now() - pipelineStartTime;

      logger.error('PIPELINE', `Pipeline failed: ${error.message}`, {
        total_duration_ms,
      });

      return {
        pipeline_version: '1.0.0',
        image_url: imageUrl,
        processed_at: new Date().toISOString(),
        total_duration_ms,
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(request: BatchRequest): Promise<BatchResult> {
    const { image_urls, options } = request;

    logger.info('PIPELINE', `Starting batch processing`, {
      total_images: image_urls.length,
    });

    const results: BatchResult['results'] = [];
    let successful = 0;
    let failed = 0;

    // Process images sequentially to avoid overwhelming APIs
    for (const imageUrl of image_urls) {
      try {
        const result = await this.processImage(imageUrl, options);
        
        if (result.status === 'success') {
          successful++;
          results.push({ image_url: imageUrl, data: result });
        } else {
          failed++;
          results.push({ image_url: imageUrl, error: result.error });
        }

      } catch (error: any) {
        failed++;
        results.push({ image_url: imageUrl, error: error.message });
        logger.error('PIPELINE', `Batch item failed: ${imageUrl}`, { error: error.message });
      }
    }

    const status = failed === 0 ? 'success' : (successful === 0 ? 'error' : 'partial');

    logger.info('PIPELINE', `Batch processing complete`, {
      total: image_urls.length,
      successful,
      failed,
      status,
    });

    return {
      status,
      total_images: image_urls.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get pipeline logs
   */
  getLogs() {
    return logger.getLogs();
  }

  /**
   * Clear pipeline logs
   */
  clearLogs() {
    logger.clearLogs();
  }
}

// Export singleton instance
export const pipeline = new ProductImagePipeline();
