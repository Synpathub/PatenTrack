import { describe, it, expect, beforeAll } from 'vitest';
import {
  createTenantSchema,
  dropTenantSchema,
  listTenantSchemas,
} from '../utils/tenant-manager.js';
import { closeConnection } from '../utils/connection.js';

describe('Tenant Manager', () => {
  const testTenantSlug = 'test-tenant';

  beforeAll(async () => {
    try {
      await dropTenantSchema(testTenantSlug);
    } catch {
      // Ignore if schema doesn't exist
    }
  });

  describe('createTenantSchema', () => {
    it('should create a new tenant schema', async () => {
      await createTenantSchema(testTenantSlug);

      const schemas = await listTenantSchemas();
      expect(schemas).toContain(`tenant_${testTenantSlug}`);
    });

    it('should be idempotent', async () => {
      await createTenantSchema(testTenantSlug);
      await createTenantSchema(testTenantSlug);

      const schemas = await listTenantSchemas();
      expect(schemas.filter((s) => s === `tenant_${testTenantSlug}`)).toHaveLength(1);
    });
  });

  describe('listTenantSchemas', () => {
    it('should return an array of schema names', async () => {
      const schemas = await listTenantSchemas();
      expect(Array.isArray(schemas)).toBe(true);
    });

    it('should only return tenant schemas', async () => {
      const schemas = await listTenantSchemas();
      for (const schema of schemas) {
        expect(schema).toMatch(/^tenant_/);
      }
    });
  });

  describe('dropTenantSchema', () => {
    it('should drop an existing tenant schema', async () => {
      await createTenantSchema(testTenantSlug);
      await dropTenantSchema(testTenantSlug);

      const schemas = await listTenantSchemas();
      expect(schemas).not.toContain(`tenant_${testTenantSlug}`);
    });

    it('should be idempotent', async () => {
      await dropTenantSchema(testTenantSlug);
      await dropTenantSchema(testTenantSlug);

      const schemas = await listTenantSchemas();
      expect(schemas).not.toContain(`tenant_${testTenantSlug}`);
    });
  });
});
