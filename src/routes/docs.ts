import { FastifyInstance } from 'fastify';

export async function docsRoutes(fastify: FastifyInstance): Promise<void> {
  // OpenAPI JSON Schema
  fastify.get('/openapi.json', {
    schema: {
      tags: ['docs'],
      summary: 'OpenAPI Schema',
      description: 'Returns the OpenAPI specification as JSON',
      response: {
        200: {
          type: 'object',
        },
      },
    },
    handler: async () => {
      return fastify.swagger();
    },
  });

  // API information
  fastify.get('/info', {
    schema: {
      tags: ['docs'],
      summary: 'API Information',
      description: 'Returns general information about the API',
      response: {
        200: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  method: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      return {
        title: 'API Adapter Service',
        version: '1.0.0',
        description: 'A Fastify-based API Adapter Service with OpenAPI support',
        endpoints: [
          {
            path: '/',
            method: 'GET',
            description: 'Root endpoint with service information',
          },
          {
            path: '/api/v1/adapters',
            method: 'GET',
            description: 'List of all available adapters',
          },
          {
            path: '/api/v1/adapters/{adapterName}/execute',
            method: 'POST',
            description: 'Execute API request through an adapter',
          },
          {
            path: '/api/v1/adapters/{adapterName}/status',
            method: 'GET',
            description: 'Get status of an adapter',
          },
          {
            path: '/api/v1/adapters/{adapterName}/test',
            method: 'GET',
            description: 'Test an adapter',
          },
          {
            path: '/api/v1/health',
            method: 'GET',
            description: 'Service Health Check',
          },
          {
            path: '/api/v1/health/detailed',
            method: 'GET',
            description: 'Detailed health check',
          },
          {
            path: '/api/v1/health/ready',
            method: 'GET',
            description: 'Readiness Check',
          },
          {
            path: '/api/v1/health/live',
            method: 'GET',
            description: 'Liveness Check',
          },
          {
            path: '/docs',
            method: 'GET',
            description: 'Swagger UI documentation',
          },
        ],
      };
    },
  });

  // Example requests
  fastify.get('/examples', {
    schema: {
      tags: ['docs'],
      summary: 'API Examples',
      description: 'Returns example requests for the API',
      response: {
        200: {
          type: 'object',
          properties: {
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  method: { type: 'string' },
                  url: { type: 'string' },
                  body: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      return {
        examples: [
          {
            name: 'List adapters',
            description: 'Get all available adapters',
            method: 'GET',
            url: '/api/v1/adapters',
            body: null,
          },
          {
            name: 'Execute API request',
            description: 'Execute a GET request through an adapter',
            method: 'POST',
            url: '/api/v1/adapters/example-api/execute',
            body: {
              request: {
                method: 'GET',
                url: '/users',
                headers: {
                  Accept: 'application/json',
                },
              },
            },
          },
          {
            name: 'Test adapter',
            description: 'Test an adapter with a test request',
            method: 'GET',
            url: '/api/v1/adapters/example-api/test',
            body: null,
          },
          {
            name: 'Health Check',
            description: 'Check service status',
            method: 'GET',
            url: '/api/v1/health',
            body: null,
          },
        ],
      };
    },
  });
}
