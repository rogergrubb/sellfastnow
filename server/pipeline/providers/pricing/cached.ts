// Cached Pricing Provider Wrapper
// Wraps any pricing provider with SKU-based caching

import { PricingProvider, PricingProviderResult } from '../base';
import { cacheManager } from '../../utils/cache';
import { logger } from '../../utils/logger';

export class CachedPricingProvider implements PricingProvider {
  name: string;
  private provider: PricingProvider;
  private cacheTTL: number;

  constructor(provider: PricingProvider, cacheTTL: number = 86400) { // 1 day default
    this.provider = provider;
    this.name = `cached-${provider.name}`;
    this.cacheTTL = cacheTTL;
  }

  isEnabled(): boolean {
    return this.provider.isEnabled();
  }

  getPriority(): number {
    return this.provider.getPriority();
  }

  async searchProduct(productName: string, category?: string): Promise<PricingProviderResult> {
    // Try cache first (by product name and category)
    const cacheKey = { provider: this.provider.name, productName, category };
    const cached = await cacheManager.get<PricingProviderResult>('pricing', cacheKey);
    
    if (cached) {
      logger.info('CACHE', `Using cached pricing result for ${this.provider.name}: ${productName}`);
      return cached;
    }

    // Call provider
    const result = await this.provider.searchProduct(productName, category);

    // Cache successful results
    if (result.status === 'success') {
      await cacheManager.set('pricing', cacheKey, result, this.cacheTTL);
      
      // Also cache by product ID (SKU, ASIN, UPC) if available
      if (result.productId) {
        const skuCacheKey = { provider: this.provider.name, productId: result.productId };
        await cacheManager.set('pricing-sku', skuCacheKey, result, this.cacheTTL * 7); // Longer TTL for SKU
        logger.info('CACHE', `Cached by SKU: ${result.productId}`);
      }
    }

    return result;
  }

  /**
   * Get product by SKU (ASIN, UPC, etc.)
   */
  async getProductBySKU(productId: string): Promise<PricingProviderResult | null> {
    const skuCacheKey = { provider: this.provider.name, productId };
    return await cacheManager.get<PricingProviderResult>('pricing-sku', skuCacheKey);
  }
}
