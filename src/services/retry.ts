import { AxiosInstance, AxiosError } from 'axios';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';

import { logger } from './logger';

export interface RetryConfig {
  enabled: boolean;
  retries: number;
  retryDelay: number; // Base delay in milliseconds
  retryCondition: (error: AxiosError) => boolean;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  maxRetryDelay: number; // Maximum delay between retries
}

export interface RetryStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retryAttempts: number;
  retrySuccesses: number;
  retryFailures: number;
  averageRetriesPerRequest: number;
  successRate: number;
}

export class RetryService {
  private config: RetryConfig;
  private stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    retryAttempts: number;
    retrySuccesses: number;
    retryFailures: number;
  };

  constructor(config: RetryConfig) {
    this.config = config;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryAttempts: 0,
      retrySuccesses: 0,
      retryFailures: 0,
    };
    logger.log(
      `Retry service initialized with ${config.retries} retries, ${config.backoffStrategy} backoff`,
    );
  }

  /**
   * Configure retry logic for an axios instance
   */
  configureRetry(axiosInstance: AxiosInstance): void {
    if (!this.config.enabled) {
      return;
    }

    const retryConfig: IAxiosRetryConfig = {
      retries: this.config.retries,
      retryDelay: (retryCount: number) => {
        return this.calculateRetryDelay(retryCount);
      },
      retryCondition: (error: AxiosError) => {
        return this.shouldRetry(error);
      },
      onRetry: (retryCount: number, error: unknown) => {
        this.onRetry(retryCount, error, (error as { config?: unknown }).config);
      },
    };

    axiosRetry(axiosInstance, retryConfig);
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(retryCount: number): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case 'fixed':
        delay = this.config.retryDelay;
        break;
      case 'linear':
        delay = this.config.retryDelay * retryCount;
        break;
      case 'exponential':
        delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
        break;
      default:
        delay = this.config.retryDelay;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    // Cap at maximum delay
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Use custom retry condition if provided
    if (this.config.retryCondition) {
      return this.config.retryCondition(error);
    }

    // Default retry conditions
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNABORTED',
      'ENETUNREACH',
    ];

    // Check for network errors
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for retryable HTTP status codes
    if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    // Check for timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Handle retry attempt
   */
  private onRetry(retryCount: number, error: unknown, requestConfig: unknown): void {
    this.stats.retryAttempts++;

    const delay = this.calculateRetryDelay(retryCount);
    const config = requestConfig as Record<string, unknown>;
    const url = (config.url as string) ?? 'unknown';
    const method = (config.method as string) ?? 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.warn(
      `Retry attempt ${retryCount} for ${method.toUpperCase()} ${url} after ${delay}ms delay. Error: ${errorMessage}`,
    );
  }

  /**
   * Handle max retries exceeded
   */
  private onMaxRetriesExceeded(retryCount: number, error: unknown, requestConfig: unknown): void {
    this.stats.retryFailures++;

    const config = requestConfig as Record<string, unknown>;
    const url = (config.url as string) ?? 'unknown';
    const method = (config.method as string) ?? 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      `Max retries (${retryCount}) exceeded for ${method.toUpperCase()} ${url}. Final error: ${errorMessage}`,
    );
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.stats.totalRequests++;
    this.stats.failedRequests++;
  }

  /**
   * Record retry success
   */
  recordRetrySuccess(): void {
    this.stats.retrySuccesses++;
  }

  /**
   * Get retry statistics
   */
  getStats(): RetryStats {
    const totalRequests = this.stats.totalRequests;
    const successRate =
      totalRequests > 0 ? (this.stats.successfulRequests / totalRequests) * 100 : 0;
    const averageRetries = totalRequests > 0 ? this.stats.retryAttempts / totalRequests : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      retryAttempts: this.stats.retryAttempts,
      retrySuccesses: this.stats.retrySuccesses,
      retryFailures: this.stats.retryFailures,
      averageRetriesPerRequest: Math.round(averageRetries * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retryAttempts: 0,
      retrySuccesses: 0,
      retryFailures: 0,
    };
    logger.log('Retry statistics reset');
  }

  /**
   * Create custom retry condition for specific adapters
   */
  createCustomRetryCondition(
    retryableStatusCodes: number[] = [],
    retryableErrors: string[] = [],
  ): (error: unknown) => boolean {
    return (error: unknown) => {
      // Type narrowing for error object
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;

        // Check for network errors
        if (
          errorObj.code &&
          typeof errorObj.code === 'string' &&
          retryableErrors.includes(errorObj.code)
        ) {
          return true;
        }

        // Check for retryable HTTP status codes
        if (
          errorObj.response &&
          typeof errorObj.response === 'object' &&
          errorObj.response !== null
        ) {
          const response = errorObj.response as Record<string, unknown>;
          if (
            response.status &&
            typeof response.status === 'number' &&
            retryableStatusCodes.includes(response.status)
          ) {
            return true;
          }
        }

        // Check for timeout errors
        if (
          errorObj.code === 'ECONNABORTED' ||
          (errorObj.message &&
            typeof errorObj.message === 'string' &&
            errorObj.message.includes('timeout'))
        ) {
          return true;
        }
      }

      return false;
    };
  }
}

// Default retry configuration
export const defaultRetryConfig: RetryConfig = {
  enabled: true,
  retries: 3,
  retryDelay: 1000,
  backoffStrategy: 'exponential',
  maxRetryDelay: 10000,
  retryCondition: (error: AxiosError) => {
    // Default retry condition - retry on network errors and 5xx status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNABORTED',
      'ENETUNREACH',
    ];

    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    if (error.response && retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  },
};
