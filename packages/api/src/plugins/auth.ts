import type { FastifyPluginAsync } from 'fastify';
import fp from '@fastify/jwt';
import { UserRole } from '@patentrack/core';
import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireRole: (
      roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role: UserRole;
      tenantId: string;
    };
    user: {
      userId: string;
      email: string;
      role: UserRole;
      tenantId: string;
    };
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fp, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  fastify.decorate('requireRole', (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();

        if (!roles.includes(request.user.role)) {
          return reply.code(403).send({ error: 'Forbidden' });
        }
      } catch (error) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    };
  });
};
