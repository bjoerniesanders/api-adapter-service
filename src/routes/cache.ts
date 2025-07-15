import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function cacheRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  const adapterService = options['adapterService'];

  // Get cache statistics
  fastify.get('/stats', {
    schema: {
      tags: ['cache'],
      summary: 'Get cache statistics',
      description: 'Returns cache performance statistics',
      response: {
        200: {
          type: 'object',
          properties: {
            hits: { type: 'number' },
            misses: { type: 'number' },
            hitRate: { type: 'number' },
            size: { type: 'number' },
            maxSize: { type: 'number' },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
    handler: async () => {
      return adapterService.getCacheStats();
    },
  });

  // Clear all cache
  fastify.delete('/clear', {
    schema: {
      tags: ['cache'],
      summary: 'Clear all cache',
      description: 'Clears all cached responses',
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
      adapterService.clearCache();
      return {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Invalidate cache for specific adapter
  fastify.delete('/invalidate/:adapterName', {
    schema: {
      tags: ['cache'],
      summary: 'Invalidate adapter cache',
      description: 'Invalidates all cached responses for a specific adapter',
      params: {
        type: 'object',
        properties: {
          adapterName: { type: 'string' },
        },
        required: ['adapterName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            adapterName: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { adapterName } = request.params as { adapterName: string };

      if (!adapterService.getAvailableAdapters().includes(adapterName)) {
        return reply.status(404).send({
          error: `Adapter '${adapterName}' not found`,
          statusCode: 404,
        });
      }

      adapterService.invalidateAdapterCache(adapterName);
      return {
        success: true,
        message: `Cache invalidated for adapter '${adapterName}'`,
        adapterName,
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Invalidate specific cache entry
  fastify.delete('/invalidate/:adapterName/entry', {
    schema: {
      tags: ['cache'],
      summary: 'Invalidate specific cache entry',
      description: 'Invalidates a specific cached response',
      params: {
        type: 'object',
        properties: {
          adapterName: { type: 'string' },
        },
        required: ['adapterName'],
      },
      body: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          url: { type: 'string' },
          params: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: ['method', 'url'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            cacheKey: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { adapterName } = request.params as { adapterName: string };
      const { method, url, params } = request.body as {
        method: string;
        url: string;
        params?: Record<string, string>;
      };

      if (!adapterService.getAvailableAdapters().includes(adapterName)) {
        return reply.status(404).send({
          error: `Adapter '${adapterName}' not found`,
          statusCode: 404,
        });
      }

      adapterService.invalidateCache(adapterName, method, url, params);
      const cacheKey = `${adapterName}|${method.toUpperCase()}|${url}|${params ? JSON.stringify(params) : ''}`;

      return {
        success: true,
        message: 'Cache entry invalidated successfully',
        cacheKey: `${cacheKey.substring(0, 50)}...`,
        timestamp: new Date().toISOString(),
      };
    },
  });
}
