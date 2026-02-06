import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('Health Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status with checks', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ready',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('checks');

      expect(body.checks).toHaveProperty('memory');
      expect(body.checks).toHaveProperty('disk');
    });

    it('should include database check', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ready',
      });

      const body = JSON.parse(response.body);
      expect(body.checks).toHaveProperty('database');
    });

    it('should include redis check', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ready',
      });

      const body = JSON.parse(response.body);
      expect(body.checks).toHaveProperty('redis');
    });
  });
});
