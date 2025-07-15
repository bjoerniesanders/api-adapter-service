import dotenv from 'dotenv';

import { AdapterConfig } from '../types';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    host: process.env.HOST ?? '0.0.0.0',
    environment: process.env.NODE_ENV ?? 'development',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    format: process.env.LOG_FORMAT ?? 'json',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW ?? '60000', 10),
  },
  adapters: {
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT ?? '30000', 10),
    defaultRetries: parseInt(process.env.DEFAULT_RETRIES ?? '3', 10),
  },
} as const;

// Example adapter configurations
export const adapterConfigs: Record<string, AdapterConfig> = {
  'example-api': {
    name: 'example-api',
    baseUrl: process.env.EXAMPLE_API_URL ?? 'https://api.example.com',
    timeout: parseInt(process.env.EXAMPLE_API_TIMEOUT ?? '30000', 10),
    retries: parseInt(process.env.EXAMPLE_API_RETRIES ?? '3', 10),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Adapter-Service/1.0.0',
    },
    auth: {
      type: 'bearer',
      credentials: {
        token: process.env.EXAMPLE_API_TOKEN ?? '',
      },
    },
  },
  'weather-api': {
    name: 'weather-api',
    baseUrl: process.env.WEATHER_API_URL ?? 'https://api.weatherapi.com/v1',
    timeout: parseInt(process.env.WEATHER_API_TIMEOUT ?? '10000', 10),
    retries: parseInt(process.env.WEATHER_API_RETRIES ?? '2', 10),
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      type: 'api-key',
      credentials: {
        key: process.env.WEATHER_API_KEY ?? '',
      },
    },
  },
};
