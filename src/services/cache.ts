import cache from 'memory-cache';

import { logger } from './logger';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'memory' | 'redis'; // Future: Redis support
}

export interface CacheKey {
  adapterName: string;
  method: string;
  url: string;
  params?: Record<string, string>;
  body?: unknown;
}

export class CacheService {
  private config: CacheConfig;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: CacheConfig) {
    this.config = config;
    logger.log(`Cache service initialized with TTL: ${config.ttl}ms, Max Size: ${config.maxSize}`);
  }

  /**
   * Generate a cache key from request parameters
   */
  private generateCacheKey(cacheKey: CacheKey): string {
    const { adapterName, method, url, params, body } = cacheKey;

    // Create a deterministic key
    const keyParts = [
      adapterName,
      method.toUpperCase(),
      url,
      params ? JSON.stringify(params) : '',
      body ? JSON.stringify(body) : '',
    ];

    return keyParts.join('|');
  }

  /**
   * Get cached response
   */
  get(cacheKey: CacheKey): unknown | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateCacheKey(cacheKey);
    const cached = cache.get(key);

    if (cached) {
      this.cacheHits++;
      logger.log(`Cache HIT for key: ${key.substring(0, 50)}...`);
      return cached;
    } else {
      this.cacheMisses++;
      logger.log(`Cache MISS for key: ${key.substring(0, 50)}...`);
      return null;
    }
  }

  /**
   * Set cached response
   */
  set(cacheKey: CacheKey, data: unknown): void {
    if (!this.config.enabled) {
      return;
    }

    const key = this.generateCacheKey(cacheKey);

    // Check if cache is full
    if (cache.size() >= this.config.maxSize) {
      this.evictOldest();
    }

    cache.put(key, data, this.config.ttl);
    logger.log(`Cached response for key: ${key.substring(0, 50)}... (TTL: ${this.config.ttl}ms)`);
  }

  /**
   * Invalidate cache for specific adapter
   */
  invalidateAdapter(adapterName: string): void {
    if (!this.config.enabled) {
      return;
    }

    const keys = cache.keys();
    const adapterKeys = keys.filter(key => key.startsWith(adapterName));

    adapterKeys.forEach(key => {
      cache.del(key);
      logger.log(`Invalidated cache for key: ${key.substring(0, 50)}...`);
    });

    logger.log(`Invalidated ${adapterKeys.length} cache entries for adapter: ${adapterName}`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(cacheKey: CacheKey): void {
    if (!this.config.enabled) {
      return;
    }

    const key = this.generateCacheKey(cacheKey);
    cache.del(key);
    logger.log(`Invalidated cache for key: ${key.substring(0, 50)}...`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    if (!this.config.enabled) {
      return;
    }

    cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
    enabled: boolean;
  } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: cache.size(),
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
    };
  }

  /**
   * Evict oldest cache entries when cache is full
   */
  private evictOldest(): void {
    const keys = cache.keys();
    if (keys.length > 0) {
      // Remove oldest entry (first in the list)
      const oldestKey = keys[0];
      cache.del(oldestKey);
      logger.log(`Evicted oldest cache entry: ${oldestKey.substring(0, 50)}...`);
    }
  }

  /**
   * Check if request should be cached based on method and status
   */
  shouldCache(method: string, statusCode: number): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Only cache successful GET requests by default
    const cacheableMethods = ['GET'];
    const cacheableStatusCodes = [200, 201, 202, 203, 204, 205, 206];

    return (
      cacheableMethods.includes(method.toUpperCase()) && cacheableStatusCodes.includes(statusCode)
    );
  }
}

// Default cache configuration
export const defaultCacheConfig: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum 1000 cached items
  strategy: 'memory',
};
