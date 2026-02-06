import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  index,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'CUSTOMER_ADMIN',
  'CUSTOMER_USER',
]);

export const ingestionJobStatusEnum = pgEnum('ingestion_job_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);

export const ingestionSourceEnum = pgEnum('ingestion_source', [
  'USPTO_BULK',
  'MANUAL_UPLOAD',
  'API_INTEGRATION',
]);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('tenants_slug_idx').on(table.slug),
  })
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    tenantIdIdx: index('users_tenant_id_idx').on(table.tenantId),
  })
);

export const ingestionJobs = pgTable(
  'ingestion_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    source: ingestionSourceEnum('source').notNull(),
    status: ingestionJobStatusEnum('status').notNull().default('PENDING'),
    totalRecords: integer('total_records').notNull().default(0),
    processedRecords: integer('processed_records').notNull().default(0),
    failedRecords: integer('failed_records').notNull().default(0),
    errorMessage: text('error_message'),
    metadata: text('metadata'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('ingestion_jobs_tenant_id_idx').on(table.tenantId),
    statusIdx: index('ingestion_jobs_status_idx').on(table.status),
  })
);

export const globalNormalizations = pgTable(
  'global_normalizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rawName: varchar('raw_name', { length: 500 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 500 }).notNull(),
    confidence: integer('confidence').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    rawNameIdx: index('global_normalizations_raw_name_idx').on(table.rawName),
    normalizedNameIdx: index('global_normalizations_normalized_name_idx').on(
      table.normalizedName
    ),
  })
);

export const maintenanceCodes = pgTable(
  'maintenance_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('maintenance_codes_code_idx').on(table.code),
  })
);

export const cpcHierarchy = pgTable(
  'cpc_hierarchy',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    level: varchar('level', { length: 20 }).notNull(),
    title: text('title').notNull(),
    parentCode: varchar('parent_code', { length: 50 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('cpc_hierarchy_code_idx').on(table.code),
    parentCodeIdx: index('cpc_hierarchy_parent_code_idx').on(table.parentCode),
  })
);
