import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { configureAuth } from '../utils/auth';

import { config } from '../config';
import { AdapterConfig, ApiRequest, AdapterResponse } from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
} from '../utils/response';

import { logger } from './logger';

export class AdapterService {
  private adapters: Map<string, AxiosInstance> = new Map();
  private adapterConfigs: Record<string, AdapterConfig>;

  constructor(adapterConfigs: Record<string, AdapterConfig>) {
    this.adapterConfigs = adapterConfigs;
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

    return axios.create(configureAuth(axiosConfig, adapterConfig));
  }

  async executeRequest(adapterName: string, request: ApiRequest): Promise<AdapterResponse> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      return createNotFoundResponse(adapterName);
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
}
