export interface ApiRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface ApiResponse {
  status: number;
  data: unknown;
  headers?: Record<string, string>;
}

export interface AdapterConfig {
  name: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  auth?: {
    type: 'basic' | 'bearer' | 'api-key';
    credentials: Record<string, string>;
  };
}

export interface AdapterRequest {
  adapterName: string;
  request: ApiRequest;
}

export interface AdapterResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode: number;
  adapterName: string;
  timestamp: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  adapters: Record<string, boolean>;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  adapterName?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}
