import { z } from 'zod';
import {
  TransactionType,
  PatentStatus,
  UserRole,
  TitleChainStatus,
  IngestionSource,
  IngestionJobStatus,
  EntityType,
} from './enums.js';

// Tenant Schema
export const tenantSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  status: z.enum(['active', 'inactive', 'suspended']),
  createdAt: z.date(),
  settings: z.record(z.unknown()).optional(),
});

export type Tenant = z.infer<typeof tenantSchema>;

// User Schema
export const userSchema = z.object({
  id: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.nativeEnum(UserRole),
  status: z.number().int().default(0),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;

// Company Schema
export const companySchema = z.object({
  id: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  logoUrl: z.string().url().optional(),
  status: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Company = z.infer<typeof companySchema>;

// Patent Schema
export const patentSchema = z.object({
  id: z.number().int().positive(),
  companyId: z.number().int().positive(),
  patentNumber: z.string().min(1).max(50),
  applicationNumber: z.string().max(50).optional(),
  title: z.string().min(1),
  status: z.nativeEnum(PatentStatus),
  grantDate: z.date().optional(),
  filingDate: z.date().optional(),
  expiryDate: z.date().optional(),
  abstract: z.string().optional(),
  illustrationUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Patent = z.infer<typeof patentSchema>;

// Transaction Schema
export const transactionSchema = z.object({
  id: z.number().int().positive(),
  patentId: z.number().int().positive(),
  reel: z.string().max(20).optional(),
  frame: z.string().max(20).optional(),
  conveyanceText: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  executionDate: z.date().optional(),
  recordedDate: z.date().optional(),
  assignorId: z.number().int().positive().optional(),
  assigneeId: z.number().int().positive().optional(),
  pdfUrl: z.string().url().optional(),
  createdAt: z.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Entity Schema
export const entitySchema = z.object({
  id: z.number().int().positive(),
  rawName: z.string().min(1).max(500),
  entityType: z.nativeEnum(EntityType),
  normalizedId: z.number().int().positive().optional(),
  createdAt: z.date(),
});

export type Entity = z.infer<typeof entitySchema>;

// NormalizedEntity Schema
export const normalizedEntitySchema = z.object({
  id: z.number().int().positive(),
  canonicalName: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  logoUrl: z.string().url().optional(),
  entityType: z.nativeEnum(EntityType),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type NormalizedEntity = z.infer<typeof normalizedEntitySchema>;

// Inventor Schema
export const inventorSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  canonicalId: z.number().int().positive().optional(),
  createdAt: z.date(),
});

export type Inventor = z.infer<typeof inventorSchema>;

// PatentFamily Schema
export const patentFamilySchema = z.object({
  id: z.number().int().positive(),
  patentId: z.number().int().positive(),
  familyId: z.string().max(50),
  memberNumber: z.string().max(50),
  memberCountry: z.string().max(10),
  memberKind: z.string().max(10),
  legalStatus: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type PatentFamily = z.infer<typeof patentFamilySchema>;

// CPCAssignment Schema
export const cpcAssignmentSchema = z.object({
  id: z.number().int().positive(),
  patentId: z.number().int().positive(),
  cpcCode: z.string().max(20),
  cpcSection: z.string().length(1),
  cpcClass: z.string().max(10),
  sequence: z.number().int(),
  createdAt: z.date(),
});

export type CPCAssignment = z.infer<typeof cpcAssignmentSchema>;

// CitedPatent Schema
export const citedPatentSchema = z.object({
  id: z.number().int().positive(),
  citingPatentId: z.number().int().positive(),
  citedNumber: z.string().max(50),
  citedAssignee: z.string().max(255).optional(),
  citedTitle: z.string().optional(),
  relationship: z.enum(['citing', 'cited_by']),
  createdAt: z.date(),
});

export type CitedPatent = z.infer<typeof citedPatentSchema>;

// TitleChain Schema
export const titleChainSchema = z.object({
  id: z.number().int().positive(),
  patentId: z.number().int().positive(),
  status: z.nativeEnum(TitleChainStatus),
  chainData: z.record(z.unknown()).optional(),
  missingLinks: z.record(z.unknown()).optional(),
  lastEvaluatedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type TitleChain = z.infer<typeof titleChainSchema>;

// ShareLink Schema
export const shareLinkSchema = z.object({
  id: z.number().int().positive(),
  token: z.string().min(1).max(100),
  tenantId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  snapshotData: z.record(z.unknown()),
  expiresAt: z.date().optional(),
  accessCount: z.number().int().default(0),
  lastAccessedAt: z.date().optional(),
  createdAt: z.date(),
});

export type ShareLink = z.infer<typeof shareLinkSchema>;

// IngestionJob Schema
export const ingestionJobSchema = z.object({
  id: z.number().int().positive(),
  source: z.nativeEnum(IngestionSource),
  status: z.nativeEnum(IngestionJobStatus),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  recordsProcessed: z.number().int().default(0),
  recordsFailed: z.number().int().default(0),
  errorLog: z.record(z.unknown()).optional(),
  retryCount: z.number().int().default(0),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type IngestionJob = z.infer<typeof ingestionJobSchema>;

// LawFirm Schema
export const lawFirmSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  normalizedId: z.number().int().positive().optional(),
  address: z.string().optional(),
  createdAt: z.date(),
});

export type LawFirm = z.infer<typeof lawFirmSchema>;

// NormalizationAudit Schema
export const normalizationAuditSchema = z.object({
  id: z.number().int().positive(),
  rawName: z.string().min(1).max(500),
  canonicalName: z.string().min(1).max(255),
  method: z.enum(['auto', 'manual']),
  confidence: z.number().min(0).max(1).optional(),
  decidedBy: z.number().int().positive().optional(),
  decidedAt: z.date(),
  previousCanonical: z.string().max(255).optional(),
  createdAt: z.date(),
});

export type NormalizationAudit = z.infer<typeof normalizationAuditSchema>;
