// Cached Vision Provider Wrapper
// Wraps any vision provider with caching

import { VisionProvider, VisionProviderResult } from '../base';
import { cacheManager } from '../../utils/cache';
import { logger } from '../../utils/logger';

export class CachedVisionProvider implements VisionProvider {
  name: string;
  private provider: VisionProvider;
  private cacheTTL: number;

  constructor(provider: VisionProvider, cacheTTL: number = 86400 * 7) { // 7 days default
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

  async analyzeImage(imageUrl: string): Promise<VisionProviderResult> {
    // Try cache first
    const cacheKey = { provider: this.provider.name, imageUrl };
    const cached = await cacheManager.get<VisionProviderResult>('vision', cacheKey);
    
    if (cached) {
      logger.info('CACHE', `Using cached vision result for ${this.provider.name}`);
      return cached;
    }

    // Call provider
    const result = await this.provider.analyzeImage(imageUrl);

    // Cache successful results
    if (result.status === 'success') {
      await cacheManager.set('vision', cacheKey, result, this.cacheTTL);
    }

    return result;
  }
}
