// Amazon Product Advertising API Client

import { logger } from '../logger';
import type { AmazonProductResult } from '../../types';

// Amazon PAAPI SDK
import * as amazonPaapi from 'amazon-paapi';

export class AmazonProductService {
  private client: any;
  private enabled: boolean;

  constructor() {
    // Check if Amazon Product API credentials are configured
    this.enabled = !!(
      process.env.AMAZON_ACCESS_KEY &&
      process.env.AMAZON_SECRET_KEY &&
      process.env.AMAZON_ASSOCIATE_TAG
    );

    if (!this.enabled) {
      logger.warn('AMAZON_PRODUCT', 'Amazon Product API credentials not configured. Will be skipped.');
      this.client = null;
      return;
    }

    try {
      this.client = amazonPaapi.GetCommonParameters({
        AccessKey: process.env.AMAZON_ACCESS_KEY!,
        SecretKey: process.env.AMAZON_SECRET_KEY!,
        PartnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com',
      });

      logger.info('AMAZON_PRODUCT', 'Amazon Product API client initialized');
    } catch (error: any) {
      logger.error('AMAZON_PRODUCT', `Failed to initialize client: ${error.message}`);
      this.enabled = false;
      this.client = null;
    }
  }

  /**
   * Search for product by name/keywords
   */
  async searchProduct(productName: string): Promise<AmazonProductResult> {
    if (!this.enabled || !this.client) {
      return {
        status: 'error',
        error: 'Amazon Product API not configured',
      };
    }

    const startTime = Date.now();
    logger.info('AMAZON_PRODUCT', `Searching for: ${productName}`);

    try {
      // Search for products
      const requestParameters = {
        Keywords: productName,
        SearchIndex: 'All',
        ItemCount: 1,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ProductInfo',
          'Offers.Listings.Price',
          'Offers.Listings.Availability.Message',
        ],
      };

      const response = await amazonPaapi.SearchItems(this.client, requestParameters);

      if (!response || !response.SearchResult || !response.SearchResult.Items || response.SearchResult.Items.length === 0) {
        const duration = Date.now() - startTime;
        logger.warn('AMAZON_PRODUCT', 'No products found', { duration_ms: duration });
        return {
          status: 'error',
          error: 'No products found',
        };
      }

      const item = response.SearchResult.Items[0];
      
      // Extract product data
      const asin = item.ASIN;
      const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown';
      const imageUrl = item.Images?.Primary?.Large?.URL;
      const url = item.DetailPageURL;

      // Extract price
      let retail_price: number | undefined;
      let currency = 'USD';
      let availability = 'unknown';

      if (item.Offers?.Listings && item.Offers.Listings.length > 0) {
        const listing = item.Offers.Listings[0];
        
        if (listing.Price?.Amount) {
          retail_price = listing.Price.Amount;
          currency = listing.Price.Currency || 'USD';
        }
        
        if (listing.Availability?.Message) {
          availability = listing.Availability.Message.toLowerCase();
        }
      }

      // Extract specifications
      const specifications: Record<string, string> = {};
      if (item.ItemInfo?.Features?.DisplayValues) {
        item.ItemInfo.Features.DisplayValues.forEach((feature: string, index: number) => {
          specifications[`feature_${index + 1}`] = feature;
        });
      }

      const duration = Date.now() - startTime;
      logger.info('AMAZON_PRODUCT', 'Product found', {
        duration_ms: duration,
        asin,
        title: title.substring(0, 50) + '...',
        price: retail_price,
      });

      return {
        status: 'success',
        asin,
        title,
        retail_price,
        currency,
        availability,
        url,
        imageUrl,
        specifications,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('AMAZON_PRODUCT', `Search failed: ${error.message}`, { duration_ms: duration });

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
export const amazonProductService = new AmazonProductService();
