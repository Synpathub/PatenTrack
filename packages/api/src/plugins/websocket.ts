import type { FastifyPluginAsync } from 'fastify';
import websocket from '@fastify/websocket';
import { createLogger } from '@patentrack/shared';

const logger = createLogger('websocket');

export const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(websocket);

  fastify.get('/ws', { websocket: true }, (connection, request) => {
    logger.info('WebSocket connection established');

    connection.socket.on('message', (message) => {
      const data = message.toString();
      logger.info('Received WebSocket message', { data });

      connection.socket.send(
        JSON.stringify({
          type: 'echo',
          message: data,
          timestamp: new Date().toISOString(),
        })
      );
    });

    connection.socket.on('close', () => {
      logger.info('WebSocket connection closed');
    });

    connection.socket.on('error', (error) => {
      logger.error('WebSocket error', { error });
    });
  });
};
