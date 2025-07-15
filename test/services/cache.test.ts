import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService, CacheKey } from '../../src/services/cache';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      enabled: true,
      ttl: 1000, // 1 second for testing
      maxSize: 10,
      strategy: 'memory',
    });
  });

  afterEach(() => {
    // Ensure cache is cleared after each test
    cacheService.clear();
  });

  describe('constructor', () => {
    const testCases = [
      {
        name: 'should initialize with correct configuration',
        config: {
          enabled: true,
          ttl: 1000,
          maxSize: 10,
          strategy: 'memory' as const,
        },
        expected: true,
      },
      {
        name: 'should initialize with disabled cache',
        config: {
          enabled: false,
          ttl: 1000,
          maxSize: 10,
          strategy: 'memory' as const,
        },
        expected: true,
      },
    ];

    testCases.forEach(({ name, config, expected }) => {
      it(name, () => {
        const service = new CacheService(config);
        expect(service).toBeInstanceOf(CacheService);
        expect(service).toBeDefined();
      });
    });
  });

  describe('set and get', () => {
    const testCases = [
      {
        name: 'should store and retrieve data with params',
        key: {
          adapterName: 'test-adapter',
          method: 'GET',
          url: '/test',
          params: { id: '123' },
        },
        data: { message: 'test data' },
        expected: { message: 'test data' },
      },
      {
        name: 'should store and retrieve data without params',
        key: {
          adapterName: 'test-adapter',
          method: 'GET',
          url: '/test',
        },
        data: { message: 'simple data' },
        expected: { message: 'simple data' },
      },
      {
        name: 'should return null for non-existent key',
        key: {
          adapterName: 'test-adapter',
          method: 'GET',
          url: '/nonexistent',
        },
        data: null,
        expected: null,
      },
    ];

    testCases.forEach(({ name, key, data, expected }) => {
      it(name, () => {
        if (data !== null) {
          cacheService.set(key, data);
        }
        const result = cacheService.get(key);
        expect(result).toEqual(expected);
      });
    });

    it('should handle cache expiration', async () => {
      const key: CacheKey = {
        adapterName: 'test-adapter',
        method: 'GET',
        url: '/test',
      };
      const data = { message: 'test data' };

      cacheService.set(key, data);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('shouldCache', () => {
    const testCases = [
      {
        name: 'should cache GET requests with 200 status',
        method: 'GET',
        status: 200,
        expected: true,
      },
      {
        name: 'should not cache POST requests',
        method: 'POST',
        status: 200,
        expected: false,
      },
      {
        name: 'should not cache PUT requests',
        method: 'PUT',
        status: 200,
        expected: false,
      },
      {
        name: 'should not cache DELETE requests',
        method: 'DELETE',
        status: 200,
        expected: false,
      },
      {
        name: 'should not cache PATCH requests',
        method: 'PATCH',
        status: 200,
        expected: false,
      },
      {
        name: 'should not cache 404 status codes',
        method: 'GET',
        status: 404,
        expected: false,
      },
      {
        name: 'should not cache 500 status codes',
        method: 'GET',
        status: 500,
        expected: false,
      },
      {
        name: 'should cache 201 status codes for GET',
        method: 'GET',
        status: 201,
        expected: true,
      },
    ];

    testCases.forEach(({ name, method, status, expected }) => {
      it(name, () => {
        expect(cacheService.shouldCache(method, status)).toBe(expected);
      });
    });
  });

  describe('clear', () => {
    const testCases = [
      {
        name: 'should clear single cache entry',
        keys: [
          {
            adapterName: 'test-adapter',
            method: 'GET',
            url: '/test1',
          },
        ],
        data: [{ message: 'test data 1' }],
      },
      {
        name: 'should clear multiple cache entries',
        keys: [
          {
            adapterName: 'test-adapter',
            method: 'GET',
            url: '/test1',
          },
          {
            adapterName: 'test-adapter',
            method: 'GET',
            url: '/test2',
          },
        ],
        data: [
          { message: 'test data 1' },
          { message: 'test data 2' },
        ],
      },
    ];

    testCases.forEach(({ name, keys, data }) => {
      it(name, () => {
        // Set cache entries
        keys.forEach((key, index) => {
          cacheService.set(key, data[index]);
          expect(cacheService.get(key)).toEqual(data[index]);
        });

        // Clear cache
        cacheService.clear();

        // Verify all entries are cleared
        keys.forEach(key => {
          expect(cacheService.get(key)).toBeNull();
        });
      });
    });
  });

  describe('invalidate', () => {
    const testCases = [
      {
        name: 'should invalidate specific cache key with params',
        key: {
          adapterName: 'test-adapter',
          method: 'GET',
          url: '/test',
          params: { id: '123' },
        },
        data: { message: 'test data' },
      },
      {
        name: 'should invalidate specific cache key without params',
        key: {
          adapterName: 'test-adapter',
          method: 'GET',
          url: '/test',
        },
        data: { message: 'simple data' },
      },
    ];

    testCases.forEach(({ name, key, data }) => {
      it(name, () => {
        cacheService.set(key, data);
        expect(cacheService.get(key)).toEqual(data);

        cacheService.invalidate(key);
        expect(cacheService.get(key)).toBeNull();
      });
    });
  });

  describe('invalidateAdapter', () => {
    const testCases = [
      {
        name: 'should invalidate all cache entries for an adapter',
        setup: [
          {
            key: {
              adapterName: 'test-adapter',
              method: 'GET',
              url: '/test1',
            },
            data: { data: '1' },
          },
          {
            key: {
              adapterName: 'test-adapter',
              method: 'GET',
              url: '/test2',
            },
            data: { data: '2' },
          },
          {
            key: {
              adapterName: 'other-adapter',
              method: 'GET',
              url: '/test3',
            },
            data: { data: '3' },
          },
        ],
        adapterToInvalidate: 'test-adapter',
        expectedRemaining: ['other-adapter'],
      },
    ];

    testCases.forEach(({ name, setup, adapterToInvalidate, expectedRemaining }) => {
      it(name, () => {
        // Set up cache entries
        setup.forEach(({ key, data }) => {
          cacheService.set(key, data);
        });

        // Invalidate adapter
        cacheService.invalidateAdapter(adapterToInvalidate);

        // Check that specified adapter entries are cleared
        setup.forEach(({ key, data }) => {
          if (key.adapterName === adapterToInvalidate) {
            expect(cacheService.get(key)).toBeNull();
          } else {
            expect(cacheService.get(key)).toEqual(data);
          }
        });
      });
    });
  });

  describe('getStats', () => {
    const testCases = [
      {
        name: 'should return cache statistics for empty cache',
        setup: [],
        expected: {
          hits: 0,
          misses: 0,
          size: 0,
          maxSize: 10,
          hitRate: 0,
        },
      },
      {
        name: 'should return cache statistics with data',
        setup: [
          {
            key: {
              adapterName: 'test-adapter',
              method: 'GET',
              url: '/test',
            },
            data: { message: 'test data' },
          },
        ],
        expected: {
          hits: 0,
          misses: 0,
          size: 1,
          maxSize: 10,
          hitRate: 0,
        },
      },
    ];

    testCases.forEach(({ name, setup, expected }) => {
      it(name, () => {
        // Clear cache before test to ensure clean state
        cacheService.clear();
        
        // Set up cache entries
        setup.forEach(({ key, data }) => {
          cacheService.set(key, data);
        });

        const stats = cacheService.getStats();

        expect(stats).toHaveProperty('hits');
        expect(stats).toHaveProperty('misses');
        expect(stats).toHaveProperty('size');
        expect(stats).toHaveProperty('maxSize');
        expect(stats).toHaveProperty('hitRate');
        expect(typeof stats.hits).toBe('number');
        expect(typeof stats.misses).toBe('number');
        expect(typeof stats.size).toBe('number');
        expect(typeof stats.maxSize).toBe('number');
        expect(typeof stats.hitRate).toBe('number');
        expect(stats.size).toBe(expected.size);
        expect(stats.maxSize).toBe(expected.maxSize);
      });
    });
  });
}); 