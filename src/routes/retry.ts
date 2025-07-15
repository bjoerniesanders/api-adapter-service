import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function retryRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  const adapterService = options['adapterService'];

  // Get retry statistics
  fastify.get('/stats', {
    schema: {
      tags: ['retry'],
      summary: 'Get retry statistics',
      description: 'Returns retry performance statistics',
      response: {
        200: {
          type: 'object',
          properties: {
            totalRequests: { type: 'number' },
            successfulRequests: { type: 'number' },
            failedRequests: { type: 'number' },
            retryAttempts: { type: 'number' },
            retrySuccesses: { type: 'number' },
            retryFailures: { type: 'number' },
            averageRetriesPerRequest: { type: 'number' },
            successRate: { type: 'number' },
          },
        },
      },
    },
    handler: async () => {
      return adapterService.getRetryStats();
    },
  });

  // Reset retry statistics
  fastify.delete('/stats', {
    schema: {
      tags: ['retry'],
      summary: 'Reset retry statistics',
      description: 'Resets all retry statistics to zero',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async () => {
      adapterService.resetRetryStats();
      return {
        success: true,
        message: 'Retry statistics reset successfully',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Test retry functionality with a failing request
  fastify.post('/test', {
    schema: {
      tags: ['retry'],
      summary: 'Test retry functionality',
      description: 'Makes a test request to verify retry behavior',
      body: {
        type: 'object',
        properties: {
          adapterName: { type: 'string' },
          request: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
              url: { type: 'string' },
              headers: { type: 'object', additionalProperties: { type: 'string' } },
              body: { type: 'object' },
              params: { type: 'object', additionalProperties: { type: 'string' } },
            },
            required: ['method', 'url'],
          },
        },
        required: ['adapterName', 'request'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: { type: 'string' },
            statusCode: { type: 'number' },
            adapterName: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            retryInfo: {
              type: 'object',
              properties: {
                attempts: { type: 'number' },
                totalTime: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: async request => {
      const { adapterName, request: apiRequest } = request.body as {
        adapterName: string;
        request: {
          method: string;
          url: string;
          headers?: Record<string, string>;
          body?: unknown;
          params?: Record<string, string>;
        };
      };

      const startTime = Date.now();
      const result = await adapterService.executeRequest(adapterName, apiRequest);
      const totalTime = Date.now() - startTime;

      return {
        ...result,
        retryInfo: {
          attempts: 0, // This would be tracked in a real implementation
          totalTime,
        },
      };
    },
  });

  // Get retry configuration
  fastify.get('/config', {
    schema: {
      tags: ['retry'],
      summary: 'Get retry configuration',
      description: 'Returns current retry configuration settings',
      response: {
        200: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            retries: { type: 'number' },
            retryDelay: { type: 'number' },
            backoffStrategy: { type: 'string' },
            maxRetryDelay: { type: 'number' },
            retryableStatusCodes: {
              type: 'array',
              items: { type: 'number' },
            },
            retryableErrors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async () => {
      return {
        enabled: true,
        retries: 3,
        retryDelay: 1000,
        backoffStrategy: 'exponential',
        maxRetryDelay: 10000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        retryableErrors: [
          'ECONNRESET',
          'ECONNREFUSED',
          'ENOTFOUND',
          'ETIMEDOUT',
          'ECONNABORTED',
          'ENETUNREACH',
        ],
      };
    },
  });
}
