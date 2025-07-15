import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { AdapterService } from '../services/adapter';
import { ApiRequest, AdapterRequest } from '../types';

export async function adapterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  const adapterService = new AdapterService(options['adapterConfigs']);

  // Get all available adapters
  fastify.get('/', {
    schema: {
      tags: ['adapter'],
      summary: 'Get available adapters',
      description: 'Returns a list of all available API adapters',
      response: {
        200: {
          type: 'object',
          properties: {
            adapters: {
              type: 'array',
              items: { type: 'string' },
            },
            count: { type: 'number' },
          },
        },
      },
    },
    handler: async () => {
      const adapters = adapterService.getAvailableAdapters();
      return {
        adapters,
        count: adapters.length,
      };
    },
  });

  // Test adapter connection (without adapter name parameter)
  fastify.post('/test', {
    schema: {
      tags: ['adapter'],
      summary: 'Test adapter connection',
      description: 'Tests a connection to an adapter with the provided configuration',
      body: {
        type: 'object',
        required: ['adapterName', 'request'],
        properties: {
          adapterName: { type: 'string' },
          request: {
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
        },
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
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
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
      const { adapterName, request: apiRequest } = request.body as AdapterRequest;

      if (!adapterName || !apiRequest) {
        return reply.status(400).send({
          error: 'Adapter name and API request are required',
          statusCode: 400,
        });
      }

      const response = await adapterService.executeRequest(adapterName, apiRequest);

      if (!response.success) {
        return reply.status(response.statusCode).send(response);
      }

      return response;
    },
  });

  // Execute API request through adapter (without adapter name parameter)
  fastify.post('/execute', {
    schema: {
      tags: ['adapter'],
      summary: 'Execute API request through adapter',
      description: 'Executes an API request through the specified adapter',
      body: {
        type: 'object',
        required: ['adapterName', 'request'],
        properties: {
          adapterName: { type: 'string' },
          request: {
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
        },
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
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
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
      const { adapterName, request: apiRequest } = request.body as AdapterRequest;

      if (!adapterName || !apiRequest) {
        return reply.status(400).send({
          error: 'Adapter name and API request are required',
          statusCode: 400,
        });
      }

      const response = await adapterService.executeRequest(adapterName, apiRequest);

      if (!response.success) {
        return reply.status(response.statusCode).send(response);
      }

      return response;
    },
  });

  // Execute API request through a specific adapter
  fastify.post('/:adapterName/execute', {
    schema: {
      tags: ['adapter'],
      summary: 'Execute API request through adapter',
      description: 'Executes an API request through the specified adapter',
      params: {
        type: 'object',
        required: ['adapterName'],
        properties: {
          adapterName: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['request'],
        properties: {
          request: {
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
        },
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
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            statusCode: { type: 'number' },
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
      const { request: apiRequest } = request.body as AdapterRequest;

      if (!apiRequest) {
        return reply.status(400).send({
          error: 'API request is required',
          statusCode: 400,
        });
      }

      const response = await adapterService.executeRequest(adapterName, apiRequest);

      if (!response.success) {
        return reply.status(response.statusCode).send(response);
      }

      return response;
    },
  });

  // Get adapter status
  fastify.get('/:adapterName/status', {
    schema: {
      tags: ['adapter'],
      summary: 'Get adapter status',
      description: 'Returns the status of a specific adapter',
      params: {
        type: 'object',
        required: ['adapterName'],
        properties: {
          adapterName: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            adapterName: { type: 'string' },
            status: { type: 'string', enum: ['available', 'unavailable'] },
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
      const isHealthy = adapterService.getAdapterHealth(adapterName);

      if (!isHealthy) {
        return reply.status(404).send({
          error: `Adapter '${adapterName}' not found`,
          statusCode: 404,
        });
      }

      return {
        adapterName,
        status: 'available',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Test request for an adapter
  fastify.get('/:adapterName/test', {
    schema: {
      tags: ['adapter'],
      summary: 'Test adapter',
      description: 'Executes a test request to the adapter',
      params: {
        type: 'object',
        required: ['adapterName'],
        properties: {
          adapterName: { type: 'string' },
        },
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

      const testRequest: ApiRequest = {
        method: 'GET',
        url: '/',
        headers: {
          Accept: 'application/json',
        },
      };

      const response = await adapterService.executeRequest(adapterName, testRequest);

      if (!response.success) {
        return reply.status(response.statusCode).send(response);
      }

      return response;
    },
  });
}
