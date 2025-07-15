import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryService, RetryConfig, defaultRetryConfig } from '../../src/services/retry';
import { AxiosError } from 'axios';

describe('RetryService', () => {
  let retryService: RetryService;

  beforeEach(() => {
    retryService = new RetryService({
      enabled: true,
      retries: 3,
      retryDelay: 100,
      backoffStrategy: 'exponential',
      maxRetryDelay: 1000,
      retryCondition: (error: AxiosError) => {
        return error.response?.status === 500 || error.code === 'ECONNRESET';
      },
    });
  });

  describe('constructor', () => {
    const testCases = [
      {
        name: 'should initialize with correct configuration',
        config: {
          enabled: true,
          retries: 3,
          retryDelay: 100,
          backoffStrategy: 'exponential' as const,
          maxRetryDelay: 1000,
          retryCondition: (error: AxiosError) => error.response?.status === 500,
        },
        expected: true,
      },
      {
        name: 'should initialize with default configuration',
        config: defaultRetryConfig,
        expected: true,
      },
    ];

    testCases.forEach(({ name, config, expected }) => {
      it(name, () => {
        const service = new RetryService(config);
        expect(service).toBeInstanceOf(RetryService);
        expect(service).toBeDefined();
      });
    });
  });

  describe('shouldRetry', () => {
    const testCases = [
      {
        name: 'should retry on 500 status code',
        error: {
          response: { status: 500 },
          code: undefined,
          message: 'Internal Server Error',
        } as AxiosError,
        expected: true,
      },
      {
        name: 'should retry on network errors',
        error: {
          response: undefined,
          code: 'ECONNRESET',
          message: 'Connection reset',
        } as AxiosError,
        expected: true,
      },
      {
        name: 'should not retry on 200 status code',
        error: {
          response: { status: 200 },
          code: undefined,
          message: 'OK',
        } as AxiosError,
        expected: false,
      },
      {
        name: 'should not retry on 404 status code',
        error: {
          response: { status: 404 },
          code: undefined,
          message: 'Not Found',
        } as AxiosError,
        expected: false,
      },
      {
        name: 'should not retry on 403 status code',
        error: {
          response: { status: 403 },
          code: undefined,
          message: 'Forbidden',
        } as AxiosError,
        expected: false,
      },
    ];

    testCases.forEach(({ name, error, expected }) => {
      it(name, () => {
        expect(retryService['shouldRetry'](error)).toBe(expected);
      });
    });

    it('should not retry when disabled', () => {
      const disabledService = new RetryService({
        ...defaultRetryConfig,
        enabled: false,
      });

      const error = {
        response: { status: 500 },
        code: undefined,
        message: 'Internal Server Error',
      } as AxiosError;

      expect(disabledService['shouldRetry'](error)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    const testCases = [
      {
        name: 'should calculate fixed delay correctly',
        config: {
          ...defaultRetryConfig,
          backoffStrategy: 'fixed' as const,
          retryDelay: 100,
        },
        retryCount: 1,
        expectedMin: 100,
      },
      {
        name: 'should calculate linear delay correctly',
        config: {
          ...defaultRetryConfig,
          backoffStrategy: 'linear' as const,
          retryDelay: 100,
        },
        retryCount: 2,
        expectedMin: 100,
      },
      {
        name: 'should calculate exponential delay correctly',
        config: {
          ...defaultRetryConfig,
          backoffStrategy: 'exponential' as const,
          retryDelay: 100,
        },
        retryCount: 3,
        expectedMin: 100,
      },
    ];

    testCases.forEach(({ name, config, retryCount, expectedMin }) => {
      it(name, () => {
        const service = new RetryService(config);
        const delay = service['calculateRetryDelay'](retryCount);
        expect(delay).toBeGreaterThanOrEqual(expectedMin);
      });
    });

    it('should respect maxRetryDelay', () => {
      const service = new RetryService({
        ...defaultRetryConfig,
        retryDelay: 1000,
        maxRetryDelay: 500,
      });

      const delay = service['calculateRetryDelay'](5);
      expect(delay).toBeLessThanOrEqual(500);
    });

    it('should have increasing delays for exponential strategy', () => {
      const service = new RetryService({
        ...defaultRetryConfig,
        backoffStrategy: 'exponential',
        retryDelay: 100,
      });

      const delay1 = service['calculateRetryDelay'](1);
      const delay2 = service['calculateRetryDelay'](2);
      const delay3 = service['calculateRetryDelay'](3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });
  });

  describe('recordSuccess and recordFailure', () => {
    const testCases = [
      {
        name: 'should record successful requests',
        actions: ['success', 'success'] as const,
        expected: {
          totalRequests: 2,
          successfulRequests: 2,
          failedRequests: 0,
        },
      },
      {
        name: 'should record failed requests',
        actions: ['failure', 'failure'] as const,
        expected: {
          totalRequests: 2,
          successfulRequests: 0,
          failedRequests: 2,
        },
      },
      {
        name: 'should record mixed requests',
        actions: ['success', 'failure', 'success'] as const,
        expected: {
          totalRequests: 3,
          successfulRequests: 2,
          failedRequests: 1,
        },
      },
    ];

    testCases.forEach(({ name, actions, expected }) => {
      it(name, () => {
        actions.forEach(action => {
          if (action === 'success') {
            retryService.recordSuccess();
          } else {
            retryService.recordFailure();
          }
        });

        const stats = retryService.getStats();
        expect(stats.totalRequests).toBe(expected.totalRequests);
        expect(stats.successfulRequests).toBe(expected.successfulRequests);
        expect(stats.failedRequests).toBe(expected.failedRequests);
      });
    });
  });

  describe('recordRetrySuccess', () => {
    const testCases = [
      {
        name: 'should record single retry success',
        count: 1,
        expected: 1,
      },
      {
        name: 'should record multiple retry successes',
        count: 3,
        expected: 3,
      },
    ];

    testCases.forEach(({ name, count, expected }) => {
      it(name, () => {
        for (let i = 0; i < count; i++) {
          retryService.recordRetrySuccess();
        }

        const stats = retryService.getStats();
        expect(stats.retrySuccesses).toBe(expected);
      });
    });
  });

  describe('getStats', () => {
    const testCases = [
      {
        name: 'should return correct statistics for mixed requests',
        setup: [
          { action: 'success' as const },
          { action: 'success' as const },
          { action: 'failure' as const },
          { action: 'retrySuccess' as const },
        ],
        expected: {
          totalRequests: 3,
          successfulRequests: 2,
          failedRequests: 1,
          retrySuccesses: 1,
        },
      },
      {
        name: 'should handle zero requests',
        setup: [],
        expected: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          retrySuccesses: 0,
        },
      },
    ];

    testCases.forEach(({ name, setup, expected }) => {
      it(name, () => {
        setup.forEach(({ action }) => {
          switch (action) {
            case 'success':
              retryService.recordSuccess();
              break;
            case 'failure':
              retryService.recordFailure();
              break;
            case 'retrySuccess':
              retryService.recordRetrySuccess();
              break;
          }
        });

        const stats = retryService.getStats();

        expect(stats.totalRequests).toBe(expected.totalRequests);
        expect(stats.successfulRequests).toBe(expected.successfulRequests);
        expect(stats.failedRequests).toBe(expected.failedRequests);
        expect(stats.retrySuccesses).toBe(expected.retrySuccesses);
        expect(stats.successRate).toBeGreaterThanOrEqual(0);
        expect(stats.averageRetriesPerRequest).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('resetStats', () => {
    const testCases = [
      {
        name: 'should reset all statistics after mixed activity',
        setup: [
          { action: 'success' as const },
          { action: 'failure' as const },
          { action: 'retrySuccess' as const },
        ],
        expected: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          retrySuccesses: 0,
        },
      },
    ];

    testCases.forEach(({ name, setup, expected }) => {
      it(name, () => {
        // Set up some activity
        setup.forEach(({ action }) => {
          switch (action) {
            case 'success':
              retryService.recordSuccess();
              break;
            case 'failure':
              retryService.recordFailure();
              break;
            case 'retrySuccess':
              retryService.recordRetrySuccess();
              break;
          }
        });

        // Reset stats
        retryService.resetStats();

        // Verify reset
        const stats = retryService.getStats();
        expect(stats.totalRequests).toBe(expected.totalRequests);
        expect(stats.successfulRequests).toBe(expected.successfulRequests);
        expect(stats.failedRequests).toBe(expected.failedRequests);
        expect(stats.retrySuccesses).toBe(expected.retrySuccesses);
      });
    });
  });
}); 