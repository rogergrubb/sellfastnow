// Step 2: Product Enrichment Layer
// Finds pricing data from Amazon, Google Shopping, and eBay

import { logger } from './utils/logger';
import { amazonProductService } from './utils/api-clients/amazon-product';
import { googleShoppingService } from './utils/api-clients/google-shopping';
import { ebayService } from './utils/api-clients/ebay';
import type { Step1Result, Step2Result, UnifiedPricing } from './types';

export class ProductEnrichmentStep {
  /**
   * Estimate price using ML-based heuristics when all APIs fail
   */
  private estimatePrice(productName: string, category: string): number {
    logger.info('STEP2', 'Using ML-based price estimation');

    // Simple category-based price ranges (in USD)
    const categoryPriceRanges: Record<string, { min: number; max: number }> = {
      'Electronics': { min: 50, max: 500 },
      'Furniture': { min: 100, max: 800 },
      'Clothing': { min: 20, max: 150 },
      'Home & Garden': { min: 30, max: 200 },
      'Sports & Outdoors': { min: 40, max: 300 },
      'Books & Media': { min: 10, max: 50 },
      'Toys & Games': { min: 15, max: 100 },
      'Automotive': { min: 50, max: 500 },
      'Other': { min: 25, max: 150 },
    };

    const range = categoryPriceRanges[category] || categoryPriceRanges['Other'];
    
    // Use midpoint as estimate
    const estimate = (range.min + range.max) / 2;
    
    logger.info('STEP2', `Estimated price: $${estimate}`, { category, range });
    return estimate;
  }

  /**
   * Unify pricing data from all sources
   */
  private unifyPricing(
    amazonResult: any,
    googleShoppingResult: any,
    ebayResult: any,
    productName: string,
    category: string
  ): UnifiedPricing {
    logger.info('STEP2', 'Unifying pricing data');

    let retail_price: number | undefined;
    let used_price_estimate: number | undefined;
    let price_confidence = 0;
    const product_identifiers: any = {};

    // Get retail price (prefer Amazon, fallback to Google Shopping)
    if (amazonResult.status === 'success' && amazonResult.retail_price) {
      retail_price = amazonResult.retail_price;
      price_confidence += 0.5;
      
      if (amazonResult.asin) {
        product_identifiers.asin = amazonResult.asin;
      }
      if (amazonResult.upc) {
        product_identifiers.upc = amazonResult.upc;
      }
    } else if (googleShoppingResult.status === 'success' && googleShoppingResult.avg_price) {
      retail_price = googleShoppingResult.avg_price;
      price_confidence += 0.3;
    }

    // Get used price estimate from eBay
    if (ebayResult.status === 'success' && ebayResult.avg_used_price) {
      used_price_estimate = ebayResult.avg_used_price;
      price_confidence += 0.3;
    }

    // If no prices found, use estimation
    if (!retail_price && !used_price_estimate) {
      logger.warn('STEP2', 'No pricing data found from APIs, using estimation');
      const estimated = this.estimatePrice(productName, category);
      retail_price = estimated;
      used_price_estimate = estimated * 0.6; // Assume 60% of retail for used
      price_confidence = 0.2; // Low confidence for estimates
    } else if (retail_price && !used_price_estimate) {
      // Estimate used price as 50-70% of retail
      used_price_estimate = retail_price * 0.6;
      price_confidence += 0.1;
    } else if (used_price_estimate && !retail_price) {
      // Estimate retail as ~1.5x used price
      retail_price = used_price_estimate * 1.5;
      price_confidence += 0.1;
    } else {
      // Both prices available
      price_confidence += 0.2;
    }

    // Cap confidence at 1.0
    price_confidence = Math.min(price_confidence, 1.0);

    logger.info('STEP2', 'Pricing unified', {
      retail_price: retail_price?.toFixed(2),
      used_price: used_price_estimate?.toFixed(2),
      confidence: price_confidence.toFixed(2),
    });

    return {
      retail_price,
      used_price_estimate,
      price_confidence,
      product_identifiers: Object.keys(product_identifiers).length > 0 ? product_identifiers : undefined,
    };
  }

  /**
   * Execute Step 2: Product Enrichment
   */
  async execute(step1Result: Step1Result, skipPricing: boolean = false): Promise<Step2Result> {
    logger.startStep('STEP2');
    const startTime = Date.now();

    if (skipPricing) {
      logger.info('STEP2', 'Pricing lookup skipped by option');
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP2', true);

      return {
        timestamp: new Date().toISOString(),
        duration_ms,
        sources: {
          amazon: { status: 'error', error: 'Skipped' },
          google_shopping: { status: 'error', error: 'Skipped' },
          ebay: { status: 'error', error: 'Skipped' },
        },
        unified: {
          price_confidence: 0,
        },
      };
    }

    try {
      const productName = step1Result.unified.primaryObject;
      const category = step1Result.unified.category;

      logger.info('STEP2', `Enriching product: ${productName}`);

      // Try APIs in sequence (not parallel to avoid rate limits)
      // Amazon first (most reliable for retail prices)
      const amazonResult = await amazonProductService.searchProduct(productName);

      // Google Shopping (for price comparison)
      const googleShoppingResult = await googleShoppingService.searchProduct(productName);

      // eBay (for used prices)
      const ebayResult = await ebayService.searchProduct(productName);

      // Unify results
      const unified = this.unifyPricing(
        amazonResult,
        googleShoppingResult,
        ebayResult,
        productName,
        category
      );

      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP2', true);

      return {
        timestamp: new Date().toISOString(),
        duration_ms,
        sources: {
          amazon: amazonResult,
          google_shopping: googleShoppingResult,
          ebay: ebayResult,
        },
        unified,
      };

    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP2', false);

      throw new Error(`Step 2 failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const productEnrichmentStep = new ProductEnrichmentStep();
