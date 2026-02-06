import type { FastifyPluginAsync } from 'fastify';
import type { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantSlug?: string;
  }
}

export const tenantContextPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const tenantSlug =
      (request.headers['x-tenant-slug'] as string) ||
      (request.user?.tenantId as string);

    if (tenantSlug) {
      request.tenantSlug = tenantSlug;
    }
  });
};
