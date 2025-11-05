// Step 2: Product Enrichment Layer (v2 - Provider-based)
// Uses provider registry with ShopSavvy as primary

import { logger } from './utils/logger';
import { usageMonitor } from './utils/usage-monitor';
import { ProviderRegistry, PricingProvider } from './providers/base';
import { ShopSavvyProvider } from './providers/pricing/shopsavvy';
import { AmazonProductProvider } from './providers/pricing/amazon';
import { CachedPricingProvider } from './providers/pricing/cached';
import type { Step1Result, Step2Result, UnifiedPricing } from './types';

export class ProductEnrichmentStepV2 {
  private pricingRegistry: ProviderRegistry<PricingProvider>;

  constructor() {
    // Initialize provider registry
    this.pricingRegistry = new ProviderRegistry<PricingProvider>();

    // Register providers (wrapped with caching)
    // Priority: ShopSavvy (1) > Amazon (2)
    this.pricingRegistry.register(new CachedPricingProvider(new ShopSavvyProvider()));
    this.pricingRegistry.register(new CachedPricingProvider(new AmazonProductProvider()));

    logger.info('STEP2', 'Pricing providers initialized');
  }

  /**
   * Estimate price using ML-based heuristics
   */
  private estimatePrice(productName: string, category: string): { retail: number; used: number } {
    logger.info('STEP2', 'Using ML-based price estimation');

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
    const retail = (range.min + range.max) / 2;
    const used = retail * 0.6;

    return { retail, used };
  }

  /**
   * Unify pricing data from all providers
   */
  private unifyPricing(results: Array<{ provider: string; result: any }>, productName: string, category: string): UnifiedPricing {
    logger.info('STEP2', 'Unifying pricing data');

    let retail_price: number | undefined;
    let used_price_estimate: number | undefined;
    let price_confidence = 0;
    const product_identifiers: any = {};
    let productDescription: string | undefined;
    let productSpecifications: any;

    // Process results in priority order
    for (const { provider, result } of results) {
      if (result.status !== 'success') continue;

      // Get retail price (prefer first successful provider)
      if (!retail_price && result.retailPrice) {
        retail_price = result.retailPrice;
        price_confidence += 0.5;
      }

      // Get used price
      if (!used_price_estimate && result.usedPrice) {
        used_price_estimate = result.usedPrice;
        price_confidence += 0.3;
      }

      // Collect product identifiers
      if (result.productId) {
        product_identifiers[provider] = result.productId;
      }

      // Get product description (prefer ShopSavvy)
      if (!productDescription && result.productDescription) {
        productDescription = result.productDescription;
      }

      // Get specifications
      if (!productSpecifications && result.specifications) {
        productSpecifications = result.specifications;
      }
    }

    // If no prices found, use estimation
    if (!retail_price && !used_price_estimate) {
      logger.warn('STEP2', 'No pricing data found, using estimation');
      const estimated = this.estimatePrice(productName, category);
      retail_price = estimated.retail;
      used_price_estimate = estimated.used;
      price_confidence = 0.2;
    } else if (retail_price && !used_price_estimate) {
      used_price_estimate = retail_price * 0.6;
      price_confidence += 0.1;
    } else if (used_price_estimate && !retail_price) {
      retail_price = used_price_estimate * 1.5;
      price_confidence += 0.1;
    } else {
      price_confidence += 0.2;
    }

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
      product_description: productDescription,
      product_specifications: productSpecifications,
    };
  }

  /**
   * Execute Step 2: Product Enrichment with provider fallback
   */
  async execute(step1Result: Step1Result, skipPricing: boolean = false): Promise<Step2Result> {
    logger.startStep('STEP2');
    const startTime = Date.now();

    if (skipPricing) {
      logger.info('STEP2', 'Pricing lookup skipped');
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP2', true);

      return {
        timestamp: new Date().toISOString(),
        duration_ms,
        sources: {} as any,
        unified: { price_confidence: 0 },
      };
    }

    try {
      const productName = step1Result.unified.primaryObject;
      const category = step1Result.unified.category;

      logger.info('STEP2', `Enriching product: ${productName}`);

      const enabledProviders = this.pricingRegistry.getEnabledProviders();
      
      if (enabledProviders.length === 0) {
        logger.warn('STEP2', 'No pricing providers available, using estimation');
        const estimated = this.estimatePrice(productName, category);
        
        return {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          sources: {} as any,
          unified: {
            retail_price: estimated.retail,
            used_price_estimate: estimated.used,
            price_confidence: 0.2,
          },
        };
      }

      logger.info('STEP2', `Available providers: ${enabledProviders.map(p => p.name).join(', ')}`);

      const results: Array<{ provider: string; result: any }> = [];

      // Try providers in priority order
      for (const provider of enabledProviders) {
        try {
          logger.info('STEP2', `Trying provider: ${provider.name}`);
          
          const result = await provider.searchProduct(productName, category);
          
          // Record usage
          await usageMonitor.recordUsage(provider.name, 'searchProduct', false);
          
          results.push({ provider: provider.name, result });

          if (result.status === 'success') {
            logger.info('STEP2', `Provider ${provider.name} succeeded`);
            // Try first successful provider, then stop
            break;
          } else {
            logger.warn('STEP2', `Provider ${provider.name} failed: ${result.error}`);
          }
        } catch (error: any) {
          logger.error('STEP2', `Provider ${provider.name} error: ${error.message}`);
        }
      }

      // Unify results
      const unified = this.unifyPricing(results, productName, category);

      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP2', true);

      // Build response
      const response: Step2Result = {
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
      logger.endStep('STEP2', false);
      throw new Error(`Step 2 failed: ${error.message}`);
    }
  }

  /**
   * Get available providers
   */
  getProviders(): PricingProvider[] {
    return this.pricingRegistry.getAllProviders();
  }
}

// Export singleton instance
export const productEnrichmentStepV2 = new ProductEnrichmentStepV2();
