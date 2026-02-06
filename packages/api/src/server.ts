import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger, loadConfig } from '@patentrack/shared';
import { authPlugin } from './plugins/auth.js';
import { tenantContextPlugin } from './plugins/tenant-context.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { websocketPlugin } from './plugins/websocket.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { setupErrorHandler } from './middleware/error-handler.js';

const logger = createLogger({ service: 'api-server' });

export async function createServer(): Promise<FastifyInstance> {
  const config = loadConfig();

  const fastify = Fastify({
    logger: false,
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true,
    trustProxy: true,
  });

  await fastify.register(cors, {
    origin: config.corsOrigin?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  await fastify.register(authPlugin);
  await fastify.register(tenantContextPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(websocketPlugin);

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/auth' });

  setupErrorHandler(fastify);

  return fastify;
}

async function start(): Promise<void> {
  try {
    const config = loadConfig();
    const server = await createServer();

    const port = config.apiPort;
    const host = config.apiHost;

    await server.listen({ port, host });

    logger.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error : new Error(String(error)) });
    process.exit(1);
  }
}

start();
