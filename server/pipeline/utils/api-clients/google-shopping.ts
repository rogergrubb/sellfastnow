// Google Shopping API Client (via SerpAPI or Custom Search)

import axios from 'axios';
import { logger } from '../logger';
import type { GoogleShoppingResult } from '../../types';

export class GoogleShoppingService {
  private apiKey: string | undefined;
  private enabled: boolean;

  constructor() {
    // Check if Google Shopping API key is configured
    this.apiKey = process.env.GOOGLE_SHOPPING_API_KEY;
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      logger.warn('GOOGLE_SHOPPING', 'Google Shopping API key not configured. Will be skipped.');
    } else {
      logger.info('GOOGLE_SHOPPING', 'Google Shopping API client initialized');
    }
  }

  /**
   * Search for product prices using Google Shopping
   * Using SerpAPI for Google Shopping results
   */
  async searchProduct(productName: string): Promise<GoogleShoppingResult> {
    if (!this.enabled || !this.apiKey) {
      return {
        status: 'error',
        error: 'Google Shopping API not configured',
      };
    }

    const startTime = Date.now();
    logger.info('GOOGLE_SHOPPING', `Searching for: ${productName}`);

    try {
      // Use SerpAPI to get Google Shopping results
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_shopping',
          q: productName,
          api_key: this.apiKey,
          num: 10,
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.shopping_results || response.data.shopping_results.length === 0) {
        const duration = Date.now() - startTime;
        logger.warn('GOOGLE_SHOPPING', 'No products found', { duration_ms: duration });
        return {
          status: 'error',
          error: 'No products found',
        };
      }

      const results = response.data.shopping_results;

      // Extract prices
      const prices: number[] = [];
      const offers: Array<{ merchant: string; price: number; url: string }> = [];

      results.forEach((result: any) => {
        if (result.price) {
          // Parse price (remove currency symbols and commas)
          const priceStr = result.price.replace(/[$,]/g, '');
          const price = parseFloat(priceStr);
          
          if (!isNaN(price)) {
            prices.push(price);
            offers.push({
              merchant: result.source || 'Unknown',
              price,
              url: result.link || '',
            });
          }
        }
      });

      if (prices.length === 0) {
        const duration = Date.now() - startTime;
        logger.warn('GOOGLE_SHOPPING', 'No valid prices found', { duration_ms: duration });
        return {
          status: 'error',
          error: 'No valid prices found',
        };
      }

      // Calculate statistics
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

      const duration = Date.now() - startTime;
      logger.info('GOOGLE_SHOPPING', 'Products found', {
        duration_ms: duration,
        count: prices.length,
        price_range: `$${min.toFixed(2)} - $${max.toFixed(2)}`,
        avg_price: `$${avg.toFixed(2)}`,
      });

      return {
        status: 'success',
        price_range: { min, max },
        merchant_count: offers.length,
        avg_price: avg,
        offers: offers.slice(0, 5), // Return top 5 offers
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('GOOGLE_SHOPPING', `Search failed: ${error.message}`, { duration_ms: duration });

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
export const googleShoppingService = new GoogleShoppingService();
