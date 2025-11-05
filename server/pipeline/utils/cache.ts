// Redis Cache Manager
// Aggressive caching to reduce API calls and costs

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';
import crypto from 'crypto';

export class CacheManager {
  private client: RedisClientType | null = null;
  private enabled: boolean = false;
  private connecting: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
    
    if (!redisUrl) {
      logger.warn('CACHE', 'Redis not configured, caching disabled');
      return;
    }

    try {
      this.connecting = true;
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        logger.error('CACHE', `Redis error: ${err.message}`);
        this.enabled = false;
      });

      this.client.on('connect', () => {
        logger.info('CACHE', 'Redis connected');
        this.enabled = true;
        this.connecting = false;
      });

      await this.client.connect();
    } catch (error: any) {
      logger.error('CACHE', `Failed to connect to Redis: ${error.message}`);
      this.enabled = false;
      this.connecting = false;
    }
  }

  /**
   * Generate cache key from data
   */
  private generateKey(prefix: string, data: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached value
   */
  async get<T>(prefix: string, key: any): Promise<T | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(prefix, key);
      const value = await this.client.get(cacheKey);
      
      if (value) {
        logger.info('CACHE', `Cache HIT: ${cacheKey}`);
        return JSON.parse(value) as T;
      }
      
      logger.info('CACHE', `Cache MISS: ${cacheKey}`);
      return null;
    } catch (error: any) {
      logger.error('CACHE', `Get failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(prefix: string, key: any, value: any, ttlSeconds: number = 86400): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      const cacheKey = this.generateKey(prefix, key);
      await this.client.setEx(cacheKey, ttlSeconds, JSON.stringify(value));
      logger.info('CACHE', `Cache SET: ${cacheKey} (TTL: ${ttlSeconds}s)`);
    } catch (error: any) {
      logger.error('CACHE', `Set failed: ${error.message}`);
    }
  }

  /**
   * Delete cached value
   */
  async delete(prefix: string, key: any): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      const cacheKey = this.generateKey(prefix, key);
      await this.client.del(cacheKey);
      logger.info('CACHE', `Cache DELETE: ${cacheKey}`);
    } catch (error: any) {
      logger.error('CACHE', `Delete failed: ${error.message}`);
    }
  }

  /**
   * Clear all cache with prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('CACHE', `Cleared ${keys.length} keys with prefix: ${prefix}`);
      }
    } catch (error: any) {
      logger.error('CACHE', `Clear prefix failed: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.enabled || !this.client) {
      return { keys: 0, memory: '0' };
    }

    try {
      const keys = await this.client.dbSize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';

      return { keys, memory };
    } catch (error: any) {
      logger.error('CACHE', `Get stats failed: ${error.message}`);
      return { keys: 0, memory: '0' };
    }
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.enabled = false;
      logger.info('CACHE', 'Redis connection closed');
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache decorator for async functions
 */
export function cached(prefix: string, ttlSeconds: number = 86400) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Try to get from cache
      const cached = await cacheManager.get(prefix, args);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cacheManager.set(prefix, args, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}
