import { describe, it, expect } from 'vitest';
import {
  tenantSchema,
  userSchema,
  patentSchema,
  transactionSchema,
  UserRole,
  PatentStatus,
  TransactionType,
  NotFoundError,
  ValidationError,
} from '../src/index.js';

describe('@patentrack/core - Schemas', () => {
  describe('tenantSchema', () => {
    it('should validate a valid tenant', () => {
      const validTenant = {
        id: 1,
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: 'active' as const,
        createdAt: new Date(),
      };
      
      const result = tenantSchema.safeParse(validTenant);
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug format', () => {
      const invalidTenant = {
        id: 1,
        name: 'Acme Corp',
        slug: 'Acme Corp!',
        status: 'active' as const,
        createdAt: new Date(),
      };
      
      const result = tenantSchema.safeParse(invalidTenant);
      expect(result.success).toBe(false);
    });
  });

  describe('userSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        id: 1,
        tenantId: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password',
        role: UserRole.CUSTOMER_ADMIN,
        status: 0,
        createdAt: new Date(),
      };
      
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        id: 1,
        tenantId: 1,
        email: 'not-an-email',
        passwordHash: 'hashed_password',
        role: UserRole.CUSTOMER_ADMIN,
        status: 0,
        createdAt: new Date(),
      };
      
      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('patentSchema', () => {
    it('should validate a valid patent', () => {
      const validPatent = {
        id: 1,
        companyId: 1,
        patentNumber: 'US10123456B2',
        title: 'Method for Processing Data',
        status: PatentStatus.GRANTED,
        createdAt: new Date(),
      };
      
      const result = patentSchema.safeParse(validPatent);
      expect(result.success).toBe(true);
    });

    it('should validate patent with optional fields', () => {
      const patentWithOptionals = {
        id: 1,
        companyId: 1,
        patentNumber: 'US10123456B2',
        applicationNumber: 'US16/123456',
        title: 'Method for Processing Data',
        status: PatentStatus.GRANTED,
        grantDate: new Date('2020-01-15'),
        filingDate: new Date('2018-05-20'),
        expiryDate: new Date('2038-05-20'),
        abstract: 'This patent describes...',
        illustrationUrl: 'https://example.com/patent.png',
        createdAt: new Date(),
      };
      
      const result = patentSchema.safeParse(patentWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('transactionSchema', () => {
    it('should validate a valid transaction', () => {
      const validTransaction = {
        id: 1,
        patentId: 1,
        type: TransactionType.ASSIGNMENT,
        createdAt: new Date(),
      };
      
      const result = transactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should validate transaction with all fields', () => {
      const fullTransaction = {
        id: 1,
        patentId: 1,
        reel: '12345',
        frame: '0001',
        conveyanceText: 'Assignment of entire interest',
        type: TransactionType.ASSIGNMENT,
        executionDate: new Date('2020-01-10'),
        recordedDate: new Date('2020-02-15'),
        assignorId: 1,
        assigneeId: 2,
        pdfUrl: 'https://example.com/assignment.pdf',
        createdAt: new Date(),
      };
      
      const result = transactionSchema.safeParse(fullTransaction);
      expect(result.success).toBe(true);
    });
  });
});

describe('@patentrack/core - Errors', () => {
  describe('NotFoundError', () => {
    it('should create error with correct status code', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
  });
});
