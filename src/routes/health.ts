import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { AdapterService } from '../services/adapter';
import { HealthCheck } from '../types';

export async function healthRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  const adapterService =
    options['adapterService'] ?? new AdapterService(options['adapterConfigs'] ?? {});
  const startTime = Date.now();

  // Health Check Endpoint
  fastify.get('/', {
    schema: {
      tags: ['health'],
      summary: 'Service Health Check',
      description: 'Checks the health status of the API Adapter Service',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            adapters: { type: 'object', additionalProperties: { type: 'boolean' } },
          },
        },
      },
    },
    handler: async () => {
      const adapters = adapterService.getAvailableAdapters();
      const adapterStatus: Record<string, boolean> = {};

      adapters.forEach(adapterName => {
        adapterStatus[adapterName] = adapterService.getAdapterHealth(adapterName);
      });

      const isHealthy = Object.values(adapterStatus).every(status => status);

      const healthCheck: HealthCheck = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
        version: '1.0.0',
        adapters: adapterStatus,
      };

      return healthCheck;
    },
  });

  // Detaillierter Health Check
  fastify.get('/detailed', {
    schema: {
      tags: ['health'],
      summary: 'Detailed Health Check',
      description: 'Returns detailed information about the service status',
      response: {
        200: {
          type: 'object',
          properties: {
            service: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                uptime: { type: 'number' },
                version: { type: 'string' },
                environment: { type: 'string' },
              },
            },
            adapters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['available', 'unavailable'] },
                  lastCheck: { type: 'string', format: 'date-time' },
                },
              },
            },
            system: {
              type: 'object',
              properties: {
                memory: { type: 'object' },
                cpu: { type: 'object' },
                nodeVersion: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      const adapters = adapterService.getAvailableAdapters();
      const adapterDetails = adapters.map(adapterName => ({
        name: adapterName,
        status: adapterService.getAdapterHealth(adapterName) ? 'available' : 'unavailable',
        lastCheck: new Date().toISOString(),
      }));

      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        service: {
          status: 'healthy',
          uptime: Date.now() - startTime,
          version: '1.0.0',
          environment: process.env['NODE_ENV'] ?? 'development',
        },
        adapters: adapterDetails,
        system: {
          memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          nodeVersion: process.version,
        },
      };
    },
  });

  // Readiness Check
  fastify.get('/ready', {
    schema: {
      tags: ['health'],
      summary: 'Readiness Check',
      description: 'Checks if the service is ready to process requests',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ready', 'not_ready'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async () => {
      const adapters = adapterService.getAvailableAdapters();
      const isReady = adapters.length > 0;

      return {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Liveness Check
  fastify.get('/live', {
    schema: {
      tags: ['health'],
      summary: 'Liveness Check',
      description: 'Checks if the service is still running',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['alive'] },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async () => {
      return {
        status: 'alive',
        timestamp: new Date().toISOString(),
      };
    },
  });
}
