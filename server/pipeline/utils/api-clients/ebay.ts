// eBay Finding API Client (for used/sold prices)

import axios from 'axios';
import { logger } from '../logger';
import type { EbayResult } from '../../types';

export class EbayService {
  private appId: string | undefined;
  private enabled: boolean;

  constructor() {
    // Check if eBay App ID is configured
    this.appId = process.env.EBAY_APP_ID;
    this.enabled = !!this.appId;

    if (!this.enabled) {
      logger.warn('EBAY', 'eBay App ID not configured. Will be skipped.');
    } else {
      logger.info('EBAY', 'eBay Finding API client initialized');
    }
  }

  /**
   * Search for sold/completed listings to estimate used prices
   */
  async searchProduct(productName: string): Promise<EbayResult> {
    if (!this.enabled || !this.appId) {
      return {
        status: 'error',
        error: 'eBay API not configured',
      };
    }

    const startTime = Date.now();
    logger.info('EBAY', `Searching for: ${productName}`);

    try {
      // Use eBay Finding API to search completed/sold listings
      const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
        params: {
          'OPERATION-NAME': 'findCompletedItems',
          'SERVICE-VERSION': '1.0.0',
          'SECURITY-APPNAME': this.appId,
          'RESPONSE-DATA-FORMAT': 'JSON',
          'REST-PAYLOAD': '',
          'keywords': productName,
          'itemFilter(0).name': 'SoldItemsOnly',
          'itemFilter(0).value': 'true',
          'itemFilter(1).name': 'Condition',
          'itemFilter(1).value': 'Used',
          'sortOrder': 'EndTimeSoonest',
          'paginationInput.entriesPerPage': '20',
        },
        timeout: 10000,
      });

      const data = response.data;
      
      if (!data.findCompletedItemsResponse ||
          !data.findCompletedItemsResponse[0].searchResult ||
          !data.findCompletedItemsResponse[0].searchResult[0].item) {
        const duration = Date.now() - startTime;
        logger.warn('EBAY', 'No sold items found', { duration_ms: duration });
        return {
          status: 'error',
          error: 'No sold items found',
        };
      }

      const items = data.findCompletedItemsResponse[0].searchResult[0].item;

      // Extract prices from sold items
      const prices: number[] = [];
      const listings: Array<{ title: string; price: number; condition: string; url: string }> = [];

      items.forEach((item: any) => {
        if (item.sellingStatus && item.sellingStatus[0].currentPrice) {
          const price = parseFloat(item.sellingStatus[0].currentPrice[0].__value__);
          
          if (!isNaN(price) && price > 0) {
            prices.push(price);
            
            listings.push({
              title: item.title ? item.title[0] : 'Unknown',
              price,
              condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Used',
              url: item.viewItemURL ? item.viewItemURL[0] : '',
            });
          }
        }
      });

      if (prices.length === 0) {
        const duration = Date.now() - startTime;
        logger.warn('EBAY', 'No valid prices found', { duration_ms: duration });
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
      logger.info('EBAY', 'Sold items found', {
        duration_ms: duration,
        count: prices.length,
        price_range: `$${min.toFixed(2)} - $${max.toFixed(2)}`,
        avg_price: `$${avg.toFixed(2)}`,
      });

      return {
        status: 'success',
        used_price_range: { min, max },
        avg_used_price: avg,
        sold_count: prices.length,
        listings: listings.slice(0, 5), // Return top 5 listings
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('EBAY', `Search failed: ${error.message}`, { duration_ms: duration });

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
export const ebayService = new EbayService();
