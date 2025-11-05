// ShopSavvy Pricing Provider (Primary)

import axios from 'axios';
import { PricingProvider, PricingProviderResult } from '../base';
import { logger } from '../../utils/logger';

export class ShopSavvyProvider implements PricingProvider {
  name = 'shopsavvy';
  private apiKey: string | undefined;
  private enabled: boolean;
  private baseUrl = 'https://api.shopsavvy.com/v1';

  constructor() {
    this.apiKey = process.env.SHOPSAVVY_API_KEY;
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      logger.warn('PROVIDER', 'ShopSavvy API key not configured');
    } else {
      logger.info('PROVIDER', 'ShopSavvy provider initialized');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPriority(): number {
    return 1; // Highest priority (primary)
  }

  async searchProduct(productName: string, category?: string): Promise<PricingProviderResult> {
    if (!this.enabled || !this.apiKey) {
      return {
        status: 'error',
        error: 'ShopSavvy API not configured',
      };
    }

    logger.info('PROVIDER', `Using ${this.name} to search: ${productName}`);

    try {
      // Search by product name
      const response = await axios.get(`${this.baseUrl}/products`, {
        params: {
          ids: productName,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.success || !response.data.data || response.data.data.length === 0) {
        return {
          status: 'error',
          error: 'No product found',
        };
      }

      const product = response.data.data[0];

      // Get pricing information
      let retailPrice: number | undefined;
      let usedPrice: number | undefined;
      let priceRange: { min: number; max: number } | undefined;

      if (product.pricing && product.pricing.length > 0) {
        const prices = product.pricing
          .filter((p: any) => p.price && p.price > 0)
          .map((p: any) => p.price);

        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;

          retailPrice = avg;
          priceRange = { min, max };

          // If we have price history, estimate used price
          if (product.price_history && product.price_history.length > 0) {
            const historicalPrices = product.price_history.map((h: any) => h.price).filter((p: number) => p > 0);
            if (historicalPrices.length > 0) {
              const avgHistorical = historicalPrices.reduce((sum: number, p: number) => sum + p, 0) / historicalPrices.length;
              // Estimate used price as 60% of average historical price
              usedPrice = avgHistorical * 0.6;
            }
          }
        }
      }

      // If no pricing found, try to extract from product data
      if (!retailPrice && product.msrp) {
        retailPrice = product.msrp;
      }

      logger.info('PROVIDER', `ShopSavvy found product: ${product.title}`, {
        retail_price: retailPrice?.toFixed(2),
        price_range: priceRange ? `$${priceRange.min.toFixed(2)}-$${priceRange.max.toFixed(2)}` : 'N/A',
      });

      return {
        status: 'success',
        retailPrice,
        usedPrice,
        priceRange,
        currency: 'USD',
        productId: product.id || product.asin || product.upc,
        productTitle: product.title,
        productDescription: product.description,
        productUrl: product.url,
        imageUrl: product.image_url,
        specifications: product.specifications,
        availability: product.availability,
      };

    } catch (error: any) {
      logger.error('PROVIDER', `ShopSavvy search failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
