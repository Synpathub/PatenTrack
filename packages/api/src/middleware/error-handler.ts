import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { createLogger } from '@patentrack/shared';
import { AppError } from '@patentrack/core';

const logger = createLogger('error-handler');

export function setupErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
      logger.error('Error occurred', {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      });

      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.name,
          message: error.message,
        });
      }

      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return reply.code(error.statusCode).send({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  );

  fastify.setNotFoundHandler((request, reply) => {
    logger.warn('Route not found', {
      url: request.url,
      method: request.method,
    });

    return reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });
}
