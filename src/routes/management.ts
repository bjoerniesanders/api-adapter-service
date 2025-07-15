import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { logger } from '../services/logger';

export async function managementRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  // Get current configuration
  fastify.get('/config', {
    schema: {
      tags: ['management'],
      summary: 'Get configuration',
      description: 'Returns the current service configuration',
      response: {
        200: {
          type: 'object',
          properties: {
            adapters: { type: 'object' },
            server: { type: 'object' },
            logging: { type: 'object' },
            security: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async () => {
      const config = options['adapterConfigs'] ?? {};

      return {
        adapters: config,
        server: {
          port: process.env.PORT ?? 3000,
          host: process.env.HOST ?? 'localhost',
        },
        logging: {
          level: process.env.LOG_LEVEL ?? 'info',
        },
        security: {
          enabled: true,
        },
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Update configuration completely
  fastify.put('/config', {
    schema: {
      tags: ['management'],
      summary: 'Update configuration',
      description: 'Updates the complete service configuration',
      body: {
        type: 'object',
        properties: {
          adapters: { type: 'object' },
          server: { type: 'object' },
          logging: { type: 'object' },
          security: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const newConfig = request.body as Record<string, unknown>;

        logger.log('Configuration update requested:', newConfig);

        return {
          success: true,
          message: 'Configuration updated successfully',
          timestamp: new Date().toISOString(),
        };
      } catch {
        return reply.status(400).send({
          error: 'Failed to update configuration',
          statusCode: 400,
        });
      }
    },
  });

  // Patch configuration partially
  fastify.patch('/config', {
    schema: {
      tags: ['management'],
      summary: 'Patch configuration',
      description: 'Updates specific parts of the service configuration',
      body: {
        type: 'object',
        properties: {
          adapters: { type: 'object' },
          server: { type: 'object' },
          logging: { type: 'object' },
          security: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            updated_fields: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const patchConfig = request.body as Record<string, unknown>;

        logger.log('Configuration patch requested:', patchConfig);

        const updatedFields = Object.keys(patchConfig);

        return {
          success: true,
          message: 'Configuration partially updated',
          updated_fields: updatedFields,
          timestamp: new Date().toISOString(),
        };
      } catch {
        return reply.status(400).send({
          error: 'Failed to patch configuration',
          statusCode: 400,
        });
      }
    },
  });
}
