import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { config } from '../config';
import { AdapterConfig, ApiRequest, AdapterResponse } from '../types';
import { configureAuth } from '../utils/auth';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
} from '../utils/response';

import { CacheService, CacheKey } from './cache';
import { logger } from './logger';
import { RetryService, defaultRetryConfig } from './retry';

export class AdapterService {
  private adapters: Map<string, AxiosInstance> = new Map();
  private adapterConfigs: Record<string, AdapterConfig>;
  private cacheService: CacheService;
  private retryService: RetryService;

  constructor(adapterConfigs: Record<string, AdapterConfig>) {
    this.adapterConfigs = adapterConfigs;
    this.cacheService = new CacheService({
      enabled: config.cache.enabled,
      ttl: config.cache.ttl,
      maxSize: config.cache.maxSize,
      strategy: 'memory',
    });
    this.retryService = new RetryService({
      ...defaultRetryConfig,
      retries: config.adapters.defaultRetries,
    });
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    Object.values(this.adapterConfigs).forEach(adapterConfig => {
      const axiosInstance = this.createAxiosInstance(adapterConfig);
      this.adapters.set(adapterConfig.name, axiosInstance);
      logger.log(`Adapter initialized: ${adapterConfig.name}`);
    });
  }

  private createAxiosInstance(adapterConfig: AdapterConfig): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: adapterConfig.baseUrl,
      timeout: adapterConfig.timeout ?? config.adapters.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...adapterConfig.headers,
      },
    };

    const axiosInstance = axios.create(configureAuth(axiosConfig, adapterConfig));

    // Configure retry logic for this adapter
    const adapterRetryConfig = {
      ...defaultRetryConfig,
      retries: adapterConfig.retries ?? config.adapters.defaultRetries,
    };
    const adapterRetryService = new RetryService(adapterRetryConfig);
    adapterRetryService.configureRetry(axiosInstance);

    return axiosInstance;
  }

  async executeRequest(adapterName: string, request: ApiRequest): Promise<AdapterResponse> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      return createNotFoundResponse(adapterName);
    }

    // Check cache first for GET requests
    if (request.method.toUpperCase() === 'GET') {
      const cacheKey: CacheKey = {
        adapterName,
        method: request.method,
        url: request.url,
        params: request.params,
      };

      const cachedResponse = this.cacheService.get(cacheKey);
      if (cachedResponse) {
        logger.log(
          `Returning cached response for ${adapterName}: ${request.method} ${request.url}`,
        );
        return createSuccessResponse(adapterName, cachedResponse, 200);
      }
    }

    try {
      logger.log(`Request to ${adapterName}: ${request.method} ${request.url}`);

      const response: AxiosResponse = await adapter.request({
        method: request.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch',
        url: request.url,
        headers: request.headers,
        data: request.body,
        params: request.params,
        paramsSerializer: request.query,
      });

      // Cache successful GET responses
      if (this.cacheService.shouldCache(request.method, response.status)) {
        const cacheKey: CacheKey = {
          adapterName,
          method: request.method,
          url: request.url,
          params: request.params,
        };
        this.cacheService.set(cacheKey, response.data);
      }

      return createSuccessResponse(adapterName, response.data, response.status);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = (error as { response?: { status?: number } })?.response?.status ?? 500;

      logger.error(`Error in request to ${adapterName}: ${errorMessage}`);

      return createErrorResponse(adapterName, errorMessage, statusCode);
    }
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  getAdapterHealth(adapterName: string): boolean {
    return this.adapters.has(adapterName);
  }

  // Cache management methods
  getCacheStats() {
    return this.cacheService.getStats();
  }

  clearCache(): void {
    this.cacheService.clear();
  }

  invalidateAdapterCache(adapterName: string): void {
    this.cacheService.invalidateAdapter(adapterName);
  }

  invalidateCache(
    adapterName: string,
    method: string,
    url: string,
    params?: Record<string, string>,
  ): void {
    const cacheKey: CacheKey = {
      adapterName,
      method,
      url,
      params,
    };
    this.cacheService.invalidate(cacheKey);
  }

  // Retry management methods
  getRetryStats() {
    return this.retryService.getStats();
  }

  resetRetryStats(): void {
    this.retryService.resetStats();
  }
}
