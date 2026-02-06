import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('@patentrack/shared - Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a clean copy - spread does NOT deep-clone
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should load valid configuration', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '4200';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const config = loadConfig();

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(4200);
    expect(config.databaseUrl).toBe('postgresql://localhost:5432/test');
    expect(config.redisUrl).toBe('redis://localhost:6379');
    expect(config.jwtSecret).toBe('test-secret');
    expect(config.jwtRefreshSecret).toBe('test-refresh-secret');
  });

  it('should fail when required DATABASE_URL is missing', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '4200';
    delete process.env.DATABASE_URL;
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    expect(() => loadConfig()).toThrow('Configuration validation failed');
  });

  it('should fail when required JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '4200';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    delete process.env.JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    expect(() => loadConfig()).toThrow('Configuration validation failed');
  });

  it('should use default values for optional fields', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const config = loadConfig();

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(4200);
    expect(config.usptoBulkDataUrl).toBe('https://bulkdata.uspto.gov');
    expect(config.githubRepo).toBe('Synpathub/PatenTrack');
  });

  it('should parse optional fields when provided', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.SENTRY_DSN = 'https://sentry.io/123';
    process.env.EPO_KEY = 'epo-key';
    process.env.EPO_SECRET = 'epo-secret';

    const config = loadConfig();

    expect(config.sentryDsn).toBe('https://sentry.io/123');
    expect(config.epoKey).toBe('epo-key');
    expect(config.epoSecret).toBe('epo-secret');
  });
});