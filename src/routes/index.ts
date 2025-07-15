import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { config } from '../config';

import { adapterRoutes } from './adapter';
import { docsRoutes } from './docs';
import { healthRoutes } from './health';
import { managementRoutes } from './management';

export async function routes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  // OpenAPI/Swagger configuration
  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'API Adapter Service',
        description: 'A Fastify-based API Adapter Service with OpenAPI support',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: `http://${config.server.host}:${config.server.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'adapter', description: 'API Adapter Endpoints' },
        { name: 'health', description: 'Health Check Endpoints' },
        { name: 'management', description: 'Management Endpoints' },
        { name: 'docs', description: 'API Documentation' },
        { name: 'root', description: 'Root Endpoints' },
      ],
      components: {
        schemas: {
          ApiRequest: {
            type: 'object',
            required: ['method', 'url'],
            properties: {
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
              url: { type: 'string' },
              headers: { type: 'object', additionalProperties: { type: 'string' } },
              body: { type: 'object' },
              params: { type: 'object', additionalProperties: { type: 'string' } },
              query: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
          AdapterResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              error: { type: 'string' },
              statusCode: { type: 'number' },
              adapterName: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          HealthCheck: {
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
    },
  });

  // Swagger UI
  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
  });

  // Register routes
  await fastify.register(adapterRoutes, {
    prefix: '/api/v1/adapters',
    adapterConfigs: options.adapterConfigs,
  });
  await fastify.register(healthRoutes, {
    prefix: '/api/v1/health',
    adapterConfigs: options.adapterConfigs,
  });
  await fastify.register(managementRoutes, {
    prefix: '/api/v1/management',
    adapterConfigs: options.adapterConfigs,
  });
  await fastify.register(docsRoutes, {
    prefix: '/docs',
  });

  // Root endpoint
  fastify.get('/', {
    schema: {
      tags: ['root'],
      summary: 'Root Endpoint',
      description: 'Welcome endpoint for the API Adapter Service',
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            version: { type: 'string' },
            documentation: { type: 'string' },
          },
        },
      },
    },
    handler: async () => {
      return {
        message: 'Welcome to the API Adapter Service',
        version: '1.0.0',
        documentation: '/docs',
      };
    },
  });
}
