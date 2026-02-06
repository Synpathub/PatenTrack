import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Set required environment variables for tests
    process.env.DATABASE_URL = 'postgresql://patentrack:patentrack_dev@localhost:5432/patentrack';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    
    try {
      server = await createServer();
    } catch (error) {
      console.warn('Warning: Could not create server for tests. Some tests may be skipped.', error);
    }
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('POST /auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toHaveProperty('error');
    });

    it('should return 400 if no body provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 401 if no token provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/profile',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
