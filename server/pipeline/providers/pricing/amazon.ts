// Amazon Product API Provider

import { PricingProvider, PricingProviderResult } from '../base';
import { amazonProductService } from '../../utils/api-clients/amazon-product';
import { logger } from '../../utils/logger';

export class AmazonProductProvider implements PricingProvider {
  name = 'amazon-product';

  isEnabled(): boolean {
    return amazonProductService.isEnabled();
  }

  getPriority(): number {
    return 2; // Secondary priority
  }

  async searchProduct(productName: string, category?: string): Promise<PricingProviderResult> {
    logger.info('PROVIDER', `Using ${this.name} to search: ${productName}`);
    
    const result = await amazonProductService.searchProduct(productName);
    
    if (result.status === 'error') {
      return {
        status: 'error',
        error: result.error,
      };
    }

    return {
      status: 'success',
      retailPrice: result.retail_price,
      currency: 'USD',
      productId: result.asin,
      productTitle: result.title,
      productUrl: result.url,
      imageUrl: result.image_url,
      specifications: result.specifications,
      availability: result.availability,
    };
  }
}
