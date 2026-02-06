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
  date,
  PgTable,
} from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'ASSIGNMENT',
  'LICENSE',
  'SECURITY_INTEREST',
  'MERGER',
  'CHANGE_OF_NAME',
]);

export const patentStatusEnum = pgEnum('patent_status', [
  'PENDING',
  'ACTIVE',
  'EXPIRED',
  'ABANDONED',
]);

export const titleChainStatusEnum = pgEnum('title_chain_status', [
  'VALID',
  'DISPUTED',
  'UNDER_REVIEW',
]);

export const entityTypeEnum = pgEnum('entity_type', [
  'COMPANY',
  'INDIVIDUAL',
  'GOVERNMENT',
  'UNIVERSITY',
]);

export function createTenantSchema(schemaName: string): Record<string, PgTable> {
  const companies = pgTable(
    `${schemaName}.companies`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      name: varchar('name', { length: 500 }).notNull(),
      normalizedName: varchar('normalized_name', { length: 500 }),
      country: varchar('country', { length: 2 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      nameIdx: index(`${schemaName}_companies_name_idx`).on(table.name),
      normalizedNameIdx: index(
        `${schemaName}_companies_normalized_name_idx`
      ).on(table.normalizedName),
    })
  );

  const patents = pgTable(
    `${schemaName}.patents`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentNumber: varchar('patent_number', { length: 50 }).notNull().unique(),
      title: text('title').notNull(),
      abstract: text('abstract'),
      filingDate: date('filing_date'),
      issueDate: date('issue_date'),
      expirationDate: date('expiration_date'),
      status: patentStatusEnum('status').notNull(),
      currentOwnerId: uuid('current_owner_id').references(() => companies.id),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      patentNumberIdx: index(`${schemaName}_patents_patent_number_idx`).on(
        table.patentNumber
      ),
      statusIdx: index(`${schemaName}_patents_status_idx`).on(table.status),
      currentOwnerIdIdx: index(`${schemaName}_patents_current_owner_id_idx`).on(
        table.currentOwnerId
      ),
    })
  );

  const transactions = pgTable(
    `${schemaName}.transactions`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      type: transactionTypeEnum('type').notNull(),
      fromEntityId: uuid('from_entity_id').references(() => companies.id),
      toEntityId: uuid('to_entity_id').references(() => companies.id),
      recordedDate: date('recorded_date').notNull(),
      executionDate: date('execution_date'),
      conveyanceText: text('conveyance_text'),
      reelFrame: varchar('reel_frame', { length: 50 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_transactions_patent_id_idx`).on(
        table.patentId
      ),
      fromEntityIdIdx: index(`${schemaName}_transactions_from_entity_id_idx`).on(
        table.fromEntityId
      ),
      toEntityIdIdx: index(`${schemaName}_transactions_to_entity_id_idx`).on(
        table.toEntityId
      ),
    })
  );

  const entities = pgTable(
    `${schemaName}.entities`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      rawName: varchar('raw_name', { length: 500 }).notNull(),
      type: entityTypeEnum('type').notNull(),
      country: varchar('country', { length: 2 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      rawNameIdx: index(`${schemaName}_entities_raw_name_idx`).on(
        table.rawName
      ),
    })
  );

  const normalizedEntities = pgTable(
    `${schemaName}.normalized_entities`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      entityId: uuid('entity_id')
        .notNull()
        .references(() => entities.id, { onDelete: 'cascade' }),
      companyId: uuid('company_id').references(() => companies.id),
      normalizedName: varchar('normalized_name', { length: 500 }).notNull(),
      confidence: integer('confidence').notNull(),
      method: varchar('method', { length: 50 }).notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      entityIdIdx: index(`${schemaName}_normalized_entities_entity_id_idx`).on(
        table.entityId
      ),
      companyIdIdx: index(
        `${schemaName}_normalized_entities_company_id_idx`
      ).on(table.companyId),
    })
  );

  const inventors = pgTable(
    `${schemaName}.inventors`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      firstName: varchar('first_name', { length: 100 }).notNull(),
      lastName: varchar('last_name', { length: 100 }).notNull(),
      country: varchar('country', { length: 2 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      lastNameIdx: index(`${schemaName}_inventors_last_name_idx`).on(
        table.lastName
      ),
    })
  );

  const patentInventors = pgTable(
    `${schemaName}.patent_inventors`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      inventorId: uuid('inventor_id')
        .notNull()
        .references(() => inventors.id, { onDelete: 'cascade' }),
      sequence: integer('sequence').notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_patent_inventors_patent_id_idx`).on(
        table.patentId
      ),
      inventorIdIdx: index(`${schemaName}_patent_inventors_inventor_id_idx`).on(
        table.inventorId
      ),
    })
  );

  const patentFamilies = pgTable(
    `${schemaName}.patent_families`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      familyId: varchar('family_id', { length: 100 }).notNull(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      familyIdIdx: index(`${schemaName}_patent_families_family_id_idx`).on(
        table.familyId
      ),
      patentIdIdx: index(`${schemaName}_patent_families_patent_id_idx`).on(
        table.patentId
      ),
    })
  );

  const cpcAssignments = pgTable(
    `${schemaName}.cpc_assignments`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      cpcCode: varchar('cpc_code', { length: 50 }).notNull(),
      section: varchar('section', { length: 10 }).notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_cpc_assignments_patent_id_idx`).on(
        table.patentId
      ),
      cpcCodeIdx: index(`${schemaName}_cpc_assignments_cpc_code_idx`).on(
        table.cpcCode
      ),
    })
  );

  const citedPatents = pgTable(
    `${schemaName}.cited_patents`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      citingPatentId: uuid('citing_patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      citedPatentNumber: varchar('cited_patent_number', {
        length: 50,
      }).notNull(),
      category: varchar('category', { length: 50 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      citingPatentIdIdx: index(
        `${schemaName}_cited_patents_citing_patent_id_idx`
      ).on(table.citingPatentId),
      citedPatentNumberIdx: index(
        `${schemaName}_cited_patents_cited_patent_number_idx`
      ).on(table.citedPatentNumber),
    })
  );

  const titleChains = pgTable(
    `${schemaName}.title_chains`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      sequence: integer('sequence').notNull(),
      ownerId: uuid('owner_id').references(() => companies.id),
      effectiveDate: date('effective_date').notNull(),
      transactionId: uuid('transaction_id').references(() => transactions.id),
      status: titleChainStatusEnum('status').notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_title_chains_patent_id_idx`).on(
        table.patentId
      ),
      ownerIdIdx: index(`${schemaName}_title_chains_owner_id_idx`).on(
        table.ownerId
      ),
    })
  );

  const shareLinks = pgTable(
    `${schemaName}.share_links`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      token: varchar('token', { length: 100 }).notNull().unique(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      createdById: uuid('created_by_id').notNull(),
      expiresAt: timestamp('expires_at'),
      viewCount: integer('view_count').notNull().default(0),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      tokenIdx: index(`${schemaName}_share_links_token_idx`).on(table.token),
      patentIdIdx: index(`${schemaName}_share_links_patent_id_idx`).on(
        table.patentId
      ),
    })
  );

  const lawFirms = pgTable(
    `${schemaName}.law_firms`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      name: varchar('name', { length: 500 }).notNull(),
      country: varchar('country', { length: 2 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      nameIdx: index(`${schemaName}_law_firms_name_idx`).on(table.name),
    })
  );

  const patentLawFirms = pgTable(
    `${schemaName}.patent_law_firms`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      lawFirmId: uuid('law_firm_id')
        .notNull()
        .references(() => lawFirms.id, { onDelete: 'cascade' }),
      role: varchar('role', { length: 100 }),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_patent_law_firms_patent_id_idx`).on(
        table.patentId
      ),
      lawFirmIdIdx: index(`${schemaName}_patent_law_firms_law_firm_id_idx`).on(
        table.lawFirmId
      ),
    })
  );

  const normalizationAudit = pgTable(
    `${schemaName}.normalization_audit`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      entityId: uuid('entity_id')
        .notNull()
        .references(() => entities.id, { onDelete: 'cascade' }),
      originalName: varchar('original_name', { length: 500 }).notNull(),
      suggestedName: varchar('suggested_name', { length: 500 }).notNull(),
      confidence: integer('confidence').notNull(),
      approvedById: uuid('approved_by_id'),
      approved: boolean('approved'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      reviewedAt: timestamp('reviewed_at'),
    },
    (table) => ({
      entityIdIdx: index(`${schemaName}_normalization_audit_entity_id_idx`).on(
        table.entityId
      ),
    })
  );

  const collections = pgTable(
    `${schemaName}.collections`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      description: text('description'),
      createdById: uuid('created_by_id').notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      createdByIdIdx: index(`${schemaName}_collections_created_by_id_idx`).on(
        table.createdById
      ),
    })
  );

  const collectionPatents = pgTable(
    `${schemaName}.collection_patents`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      collectionId: uuid('collection_id')
        .notNull()
        .references(() => collections.id, { onDelete: 'cascade' }),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      addedById: uuid('added_by_id').notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      collectionIdIdx: index(
        `${schemaName}_collection_patents_collection_id_idx`
      ).on(table.collectionId),
      patentIdIdx: index(`${schemaName}_collection_patents_patent_id_idx`).on(
        table.patentId
      ),
    })
  );

  const comments = pgTable(
    `${schemaName}.comments`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      patentId: uuid('patent_id')
        .notNull()
        .references(() => patents.id, { onDelete: 'cascade' }),
      userId: uuid('user_id').notNull(),
      content: text('content').notNull(),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
      patentIdIdx: index(`${schemaName}_comments_patent_id_idx`).on(
        table.patentId
      ),
      userIdIdx: index(`${schemaName}_comments_user_id_idx`).on(table.userId),
    })
  );

  const activityLog = pgTable(
    `${schemaName}.activity_log`,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      userId: uuid('user_id').notNull(),
      action: varchar('action', { length: 100 }).notNull(),
      resourceType: varchar('resource_type', { length: 100 }).notNull(),
      resourceId: uuid('resource_id').notNull(),
      metadata: text('metadata'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (table) => ({
      userIdIdx: index(`${schemaName}_activity_log_user_id_idx`).on(
        table.userId
      ),
      resourceTypeIdx: index(
        `${schemaName}_activity_log_resource_type_idx`
      ).on(table.resourceType),
      createdAtIdx: index(`${schemaName}_activity_log_created_at_idx`).on(
        table.createdAt
      ),
    })
  );

  return {
    companies,
    patents,
    transactions,
    entities,
    normalizedEntities,
    inventors,
    patentInventors,
    patentFamilies,
    cpcAssignments,
    citedPatents,
    titleChains,
    shareLinks,
    lawFirms,
    patentLawFirms,
    normalizationAudit,
    collections,
    collectionPatents,
    comments,
    activityLog,
  };
}
