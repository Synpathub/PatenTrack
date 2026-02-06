import type { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: process.env.REDIS_URL
      ? {
          host: new URL(process.env.REDIS_URL).hostname,
          port: parseInt(new URL(process.env.REDIS_URL).port || '6379'),
        }
      : undefined,
  });
};
