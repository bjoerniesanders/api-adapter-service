import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { buildServer } from '../../src/server';

describe('API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Reset state between tests for better isolation
  beforeEach(async () => {
    // Clear cache between tests
    await request(app.server).delete('/api/v1/cache/clear');
    
    // Reset retry statistics between tests
    await request(app.server).delete('/api/v1/retry/stats');
  });

  describe('Root Endpoint', () => {
    const testCases = [
      {
        name: 'should return welcome message',
        method: 'GET',
        path: '/',
        expectedStatus: 200,
        expectedProperties: ['message', 'version', 'documentation'],
        expectedMessage: 'Welcome to the API Adapter Service',
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties, expectedMessage }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
        expect(response.body.message).toBe(expectedMessage);
      });
    });
  });

  describe('Health Check Endpoints', () => {
    const testCases = [
      {
        name: 'should return basic health status',
        method: 'GET',
        path: '/api/v1/health',
        expectedStatus: 200,
        expectedProperties: ['status', 'timestamp', 'uptime', 'version', 'adapters'],
      },
      {
        name: 'should return detailed health status',
        method: 'GET',
        path: '/api/v1/health/detailed',
        expectedStatus: 200,
        expectedProperties: ['service', 'adapters', 'system'],
      },
      {
        name: 'should return readiness status',
        method: 'GET',
        path: '/api/v1/health/ready',
        expectedStatus: 200,
        expectedProperties: ['status', 'timestamp'],
      },
      {
        name: 'should return liveness status',
        method: 'GET',
        path: '/api/v1/health/live',
        expectedStatus: 200,
        expectedProperties: ['status', 'timestamp'],
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        if (expectedProperties.length > 0) {
          expectedProperties.forEach(prop => {
            expect(response.body).toHaveProperty(prop);
          });
        }
      });
    });
  });

  describe('Adapter Endpoints', () => {
    const testCases = [
      {
        name: 'should list available adapters',
        method: 'GET',
        path: '/api/v1/adapters',
        expectedStatus: 200,
        expectedProperties: ['adapters'],
      },
      {
        name: 'should return adapter status',
        method: 'GET',
        path: '/api/v1/adapters/example-api/status',
        expectedStatus: 200,
        expectedProperties: ['adapterName', 'status'],
      },
      {
        name: 'should test adapter',
        method: 'GET',
        path: '/api/v1/adapters/example-api/test',
        expectedStatus: 500,
        expectedProperties: ['adapterName', 'success', 'error', 'statusCode', 'timestamp'],
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
      });
    });

    describe('Adapter Execute Endpoint', () => {
      const testCases = [
        {
          name: 'should execute GET request through adapter',
          method: 'POST',
          path: '/api/v1/adapters/example-api/execute',
          body: {
            request: {
              method: 'GET',
              url: '/test',
              headers: {
                Accept: 'application/json',
              },
            },
          },
          expectedStatus: 500, 
          expectedProperties: ['success', 'adapterName', 'timestamp', 'error'],
        },
        {
          name: 'should execute POST request through adapter',
          method: 'POST',
          path: '/api/v1/adapters/example-api/execute',
          body: {
            request: {
              method: 'POST',
              url: '/test',
              headers: {
                'Content-Type': 'application/json',
              },
              body: {
                test: 'data',
              },
            },
          },
          expectedStatus: 500, // Expected to fail due to external API unavailability
          expectedProperties: ['success', 'adapterName', 'timestamp', 'error'],
        },
        {
          name: 'should handle non-existent adapter',
          method: 'POST',
          path: '/api/v1/adapters/non-existent/execute',
          body: {
            request: {
              method: 'GET',
              url: '/test',
            },
          },
          expectedStatus: 404,
          expectedProperties: ['error', 'statusCode'],
        },
      ];

      testCases.forEach(({ name, method, path, body, expectedStatus, expectedProperties }) => {
        it(name, async () => {
          const response = await request(app.server)[method.toLowerCase()](path)
            .send(body)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(expectedStatus);
          expectedProperties.forEach(prop => {
            expect(response.body).toHaveProperty(prop);
          });
        });
      });
    });
  });

  describe('Management Endpoints', () => {
    const testCases = [
      {
        name: 'should get current configuration',
        method: 'GET',
        path: '/api/v1/management/config',
        expectedStatus: 200,
        expectedProperties: ['adapters', 'server', 'logging', 'security', 'timestamp'],
      },
      {
        name: 'should update configuration',
        method: 'PUT',
        path: '/api/v1/management/config',
        body: {
          adapters: {
            test: {
              name: 'test',
              baseUrl: 'https://test.com',
            },
          },
          server: {
            port: 3000,
          },
        },
        expectedStatus: 200,
        expectedProperties: ['success', 'message', 'timestamp'],
      },
      {
        name: 'should patch configuration',
        method: 'PATCH',
        path: '/api/v1/management/config',
        body: {
          server: {
            port: 3001,
          },
        },
        expectedStatus: 200,
        expectedProperties: ['success', 'message', 'updated_fields', 'timestamp'],
      },
    ];

    testCases.forEach(({ name, method, path, body, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const req = request(app.server)[method.toLowerCase()](path);
        
        if (body) {
          req.send(body).set('Content-Type', 'application/json');
        }
        
        const response = await req;
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
      });
    });
  });

  describe('Cache Management Endpoints', () => {
    const testCases = [
      {
        name: 'should get cache statistics',
        method: 'GET',
        path: '/api/v1/cache/stats',
        expectedStatus: 200,
        expectedProperties: ['hits', 'misses', 'size', 'maxSize', 'hitRate'],
      },
      {
        name: 'should clear cache',
        method: 'DELETE',
        path: '/api/v1/cache/clear',
        expectedStatus: 200,
        expectedProperties: ['success', 'message', 'timestamp'],
      },
      {
        name: 'should invalidate adapter cache',
        method: 'DELETE',
        path: '/api/v1/cache/invalidate/example-api',
        expectedStatus: 200,
        expectedProperties: ['success', 'message', 'adapterName', 'timestamp'],
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
      });
    });
  });

  describe('Retry Management Endpoints', () => {
    const testCases = [
      {
        name: 'should get retry statistics',
        method: 'GET',
        path: '/api/v1/retry/stats',
        expectedStatus: 200,
        expectedProperties: [
          'totalRequests',
          'successfulRequests',
          'failedRequests',
          'retryAttempts',
          'retrySuccesses',
          'retryFailures',
          'averageRetriesPerRequest',
          'successRate',
        ],
      },
      {
        name: 'should reset retry statistics',
        method: 'DELETE',
        path: '/api/v1/retry/stats',
        expectedStatus: 200,
        expectedProperties: ['success', 'message', 'timestamp'],
      },
      {
        name: 'should get retry configuration',
        method: 'GET',
        path: '/api/v1/retry/config',
        expectedStatus: 200,
        expectedProperties: [
          'enabled',
          'retries',
          'retryDelay',
          'backoffStrategy',
          'maxRetryDelay',
          'retryableStatusCodes',
          'retryableErrors',
        ],
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
      });
    });

    describe('Retry Test Endpoint', () => {
      const testCases = [
        {
          name: 'should test retry functionality with GET request',
          method: 'POST',
          path: '/api/v1/retry/test',
          body: {
            adapterName: 'example-api',
            request: {
              method: 'GET',
              url: '/test',
              headers: {
                Accept: 'application/json',
              },
            },
          },
          expectedStatus: 200, // Retry route always returns 200, even for failed requests
          expectedProperties: ['success', 'adapterName', 'timestamp', 'retryInfo', 'error'],
        },
        {
          name: 'should test retry functionality with POST request',
          method: 'POST',
          path: '/api/v1/retry/test',
          body: {
            adapterName: 'example-api',
            request: {
              method: 'POST',
              url: '/test',
              headers: {
                'Content-Type': 'application/json',
              },
              body: {
                test: 'data',
              },
            },
          },
          expectedStatus: 200, // Retry route always returns 200, even for failed requests
          expectedProperties: ['success', 'adapterName', 'timestamp', 'retryInfo', 'error'],
        },
      ];

      testCases.forEach(({ name, method, path, body, expectedStatus, expectedProperties }) => {
        it(name, async () => {
          const response = await request(app.server)[method.toLowerCase()](path)
            .send(body)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(expectedStatus);
          expectedProperties.forEach(prop => {
            expect(response.body).toHaveProperty(prop);
          });
        });
      });
    });
  });

  describe('Documentation Endpoints', () => {
    const testCases = [
      {
        name: 'should return OpenAPI schema',
        method: 'GET',
        path: '/docs/openapi.json',
        expectedStatus: 200,
        expectedProperties: [], // Accept any response structure
      },
      {
        name: 'should return API information',
        method: 'GET',
        path: '/docs/info',
        expectedStatus: 200,
        expectedProperties: ['title', 'version', 'description', 'endpoints'],
      },
      {
        name: 'should return API examples',
        method: 'GET',
        path: '/docs/examples',
        expectedStatus: 200,
        expectedProperties: ['examples'],
      },
    ];

    testCases.forEach(({ name, method, path, expectedStatus, expectedProperties }) => {
      it(name, async () => {
        const response = await request(app.server)[method.toLowerCase()](path);
        
        expect(response.status).toBe(expectedStatus);
        expectedProperties.forEach(prop => {
          expect(response.body).toHaveProperty(prop);
        });
      });
    });
  });
}); 