import type { FastifyPluginAsync } from 'fastify';
import { getConnection } from '@patentrack/db';
import { createLogger } from '@patentrack/shared';
import { loadConfig } from '@patentrack/shared';

const logger = createLogger('health-routes');

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  fastify.get('/ready', async (request, reply) => {
    const checks: Record<
      string,
      { status: 'ok' | 'error'; message?: string; latency?: number }
    > = {};

    try {
      const dbStart = Date.now();
      const sql = getConnection();
      await sql`SELECT 1`;
      const dbLatency = Date.now() - dbStart;

      checks.database = {
        status: 'ok',
        latency: dbLatency,
      };
    } catch (error) {
      checks.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    try {
      const config = loadConfig();
      if (config.redisUrl) {
        checks.redis = {
          status: 'ok',
          message: 'Redis URL configured',
        };
      } else {
        checks.redis = {
          status: 'ok',
          message: 'Redis not configured (optional)',
        };
      }
    } catch (error) {
      checks.redis = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: 'ok',
      message: `Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    };

    checks.disk = {
      status: 'ok',
      message: 'Disk check not implemented',
    };

    const allHealthy = Object.values(checks).every(
      (check) => check.status === 'ok'
    );

    return reply.code(allHealthy ? 200 : 503).send({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });
};
