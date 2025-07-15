import Fastify, { FastifyInstance } from 'fastify';

import { config, adapterConfigs } from './config';
import { routes } from './routes';
import { logger } from './services/logger';

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true, // Simple console logging
  });

  // CORS Plugin
  await fastify.register(import('@fastify/cors'), {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });

  // Helmet for security
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Rate Limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // Kompression
  await fastify.register(import('@fastify/compress'));

  // Register routes with adapter configuration
  await fastify.register(routes, { adapterConfigs });

  return fastify;
}

async function startServer(): Promise<void> {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.log(`Server running on http://${config.server.host}:${config.server.port}`);
    logger.log(`Swagger UI available at http://${config.server.host}:${config.server.port}/docs`);
    logger.log(
      `Health Check available at http://${config.server.host}:${config.server.port}/api/v1/health`,
    );

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.log(`Signal ${signal} received, shutting down server...`);
      await server.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start server when this file is executed directly
if (require.main === module) {
  void startServer();
}

export { buildServer, startServer };
