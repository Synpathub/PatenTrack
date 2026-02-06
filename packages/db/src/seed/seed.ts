import { getConnection } from '../utils/connection.js';
import {
  createTenantSchema,
  runMigrationsForTenant,
} from '../utils/tenant-manager.js';
import { createLogger } from '@patentrack/shared';
import bcrypt from 'bcrypt';

const logger = createLogger({ service: 'seed' });

async function seed(): Promise<void> {
  logger.info('Starting database seeding');

  const sql = getConnection();

  logger.info('Seeding tenants');

  const [acmeTenant] = await sql`
    INSERT INTO tenants (name, slug, is_active)
    VALUES ('Acme Corp', 'acme', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  const [techTenant] = await sql`
    INSERT INTO tenants (name, slug, is_active)
    VALUES ('TechVentures Inc', 'techventures', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  logger.info('Seeding users');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  await sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
    VALUES 
      (${acmeTenant!.id}, 'admin@acme.com', ${adminPasswordHash}, 'Admin', 'User', 'ADMIN', true),
      (${acmeTenant!.id}, 'john.doe@acme.com', ${userPasswordHash}, 'John', 'Doe', 'CUSTOMER_ADMIN', true),
      (${acmeTenant!.id}, 'jane.smith@acme.com', ${userPasswordHash}, 'Jane', 'Smith', 'CUSTOMER_USER', true),
      (${techTenant!.id}, 'admin@techventures.com', ${adminPasswordHash}, 'Tech', 'Admin', 'ADMIN', true),
      (${techTenant!.id}, 'user@techventures.com', ${userPasswordHash}, 'Tech', 'User', 'CUSTOMER_USER', true)
    ON CONFLICT (email) DO NOTHING
  `;

  logger.info('Seeding global normalizations');

  await sql`
    INSERT INTO global_normalizations (raw_name, normalized_name, confidence)
    VALUES 
      ('International Business Machines Corp.', 'IBM', 95),
      ('INTERNATIONAL BUSINESS MACHINES CORPORATION', 'IBM', 95),
      ('I.B.M.', 'IBM', 90),
      ('Microsoft Corporation', 'Microsoft', 98),
      ('MICROSOFT CORP', 'Microsoft', 95),
      ('Apple Inc.', 'Apple', 98),
      ('APPLE COMPUTER INC', 'Apple', 90),
      ('Google LLC', 'Google', 98),
      ('GOOGLE INC', 'Google', 95)
    ON CONFLICT DO NOTHING
  `;

  logger.info('Seeding maintenance codes');

  await sql`
    INSERT INTO maintenance_codes (code, description)
    VALUES 
      ('M1551', 'Payment of Maintenance Fee, 4th Year, Large Entity'),
      ('M1552', 'Payment of Maintenance Fee, 8th Year, Large Entity'),
      ('M1553', 'Payment of Maintenance Fee, 12th Year, Large Entity'),
      ('M2551', 'Payment of Maintenance Fee, 4th Year, Small Entity'),
      ('M2552', 'Payment of Maintenance Fee, 8th Year, Small Entity'),
      ('M2553', 'Payment of Maintenance Fee, 12th Year, Small Entity')
    ON CONFLICT (code) DO NOTHING
  `;

  logger.info('Seeding CPC hierarchy');

  await sql`
    INSERT INTO cpc_hierarchy (code, level, title, parent_code)
    VALUES 
      ('H', 'section', 'Electricity', NULL),
      ('H04', 'class', 'Electric Communication Technique', 'H'),
      ('H04L', 'subclass', 'Transmission of Digital Information', 'H04'),
      ('H04L9/00', 'group', 'Cryptographic mechanisms or cryptographic arrangements', 'H04L'),
      ('G', 'section', 'Physics', NULL),
      ('G06', 'class', 'Computing; Calculating; Counting', 'G'),
      ('G06F', 'subclass', 'Electric Digital Data Processing', 'G06'),
      ('G06F21/00', 'group', 'Security arrangements for protecting computers', 'G06F'),
      ('A', 'section', 'Human Necessities', NULL),
      ('A61', 'class', 'Medical or Veterinary Science; Hygiene', 'A'),
      ('A61K', 'subclass', 'Preparations for Medical, Dental or Toiletry Purposes', 'A61')
    ON CONFLICT (code) DO NOTHING
  `;

  logger.info('Seeding ingestion jobs');

  await sql`
    INSERT INTO ingestion_jobs (tenant_id, source, status, total_records, processed_records, failed_records)
    VALUES 
      (${acmeTenant!.id}, 'USPTO_BULK', 'COMPLETED', 1000, 1000, 0),
      (${acmeTenant!.id}, 'MANUAL_UPLOAD', 'COMPLETED', 50, 50, 0),
      (${techTenant!.id}, 'USPTO_BULK', 'RUNNING', 500, 250, 5)
  `;

  logger.info('Creating tenant schemas');

  await createTenantSchema('acme');
  await runMigrationsForTenant('acme');

  await createTenantSchema('techventures');
  await runMigrationsForTenant('techventures');

  logger.info('Seeding tenant-specific data for Acme');

  await sql`SET search_path TO tenant_acme, public`;

  const [ibm] = await sql`
    INSERT INTO tenant_acme.companies (name, normalized_name, country)
    VALUES ('IBM Corporation', 'IBM', 'US')
    RETURNING id
  `;

  const [microsoft] = await sql`
    INSERT INTO tenant_acme.companies (name, normalized_name, country)
    VALUES ('Microsoft Corporation', 'Microsoft', 'US')
    RETURNING id
  `;

  const [google] = await sql`
    INSERT INTO tenant_acme.companies (name, normalized_name, country)
    VALUES ('Google LLC', 'Google', 'US')
    RETURNING id
  `;

  const [patent1] = await sql`
    INSERT INTO tenant_acme.patents (patent_number, title, abstract, filing_date, issue_date, expiration_date, status, current_owner_id)
    VALUES (
      'US10123456B2',
      'Method and system for secure data transmission',
      'A novel approach to encrypting data during transmission using quantum key distribution.',
      '2018-01-15',
      '2020-06-20',
      '2040-06-20',
      'ACTIVE',
      ${ibm!.id}
    )
    RETURNING id
  `;

  const [patent2] = await sql`
    INSERT INTO tenant_acme.patents (patent_number, title, abstract, filing_date, issue_date, expiration_date, status, current_owner_id)
    VALUES (
      'US10234567B1',
      'Artificial intelligence-based recommendation engine',
      'System for generating personalized recommendations using deep learning algorithms.',
      '2017-03-22',
      '2019-09-15',
      '2039-09-15',
      'ACTIVE',
      ${microsoft!.id}
    )
    RETURNING id
  `;

  const [patent3] = await sql`
    INSERT INTO tenant_acme.patents (patent_number, title, abstract, filing_date, issue_date, expiration_date, status, current_owner_id)
    VALUES (
      'US10345678B2',
      'Cloud-based data processing architecture',
      'Scalable architecture for processing large datasets in a distributed cloud environment.',
      '2016-07-10',
      '2019-01-25',
      '2039-01-25',
      'ACTIVE',
      ${google!.id}
    )
    RETURNING id
  `;




  await sql`
    INSERT INTO tenant_acme.transactions (patent_id, type, from_entity_id, to_entity_id, recorded_date, execution_date, conveyance_text, reel_frame)
    VALUES (
      ${patent1!.id},
      'ASSIGNMENT',
      NULL,
      ${ibm!.id},
      '2020-06-21',
      '2020-06-20',
      'Assignment of entire right, title, and interest',
      '056789/0123'
    )
  `;

  await sql`
    INSERT INTO tenant_acme.transactions (patent_id, type, from_entity_id, to_entity_id, recorded_date, execution_date, conveyance_text, reel_frame)
    VALUES (
      ${patent2!.id},
      'ASSIGNMENT',
      NULL,
      ${microsoft!.id},
      '2019-09-16',
      '2019-09-15',
      'Assignment of entire right, title, and interest',
      '056790/0456'
    )
  `;

  const [entity1] = await sql`
    INSERT INTO tenant_acme.entities (raw_name, type, country)
    VALUES ('International Business Machines Corporation', 'COMPANY', 'US')
    RETURNING id
  `;

  const [entity2] = await sql`
    INSERT INTO tenant_acme.entities (raw_name, type, country)
    VALUES ('MICROSOFT CORP', 'COMPANY', 'US')
    RETURNING id
  `;

  await sql`
    INSERT INTO tenant_acme.normalized_entities (entity_id, company_id, normalized_name, confidence, method)
    VALUES 
      (${entity1!.id}, ${ibm!.id}, 'IBM', 95, 'ml-model'),
      (${entity2!.id}, ${microsoft!.id}, 'Microsoft', 95, 'ml-model')
  `;

  const [inventor1] = await sql`
    INSERT INTO tenant_acme.inventors (first_name, last_name, country)
    VALUES ('Alice', 'Johnson', 'US')
    RETURNING id
  `;

  const [inventor2] = await sql`
    INSERT INTO tenant_acme.inventors (first_name, last_name, country)
    VALUES ('Bob', 'Smith', 'US')
    RETURNING id
  `;

  const [inventor3] = await sql`
    INSERT INTO tenant_acme.inventors (first_name, last_name, country)
    VALUES ('Charlie', 'Brown', 'CA')
    RETURNING id
  `;

  await sql`
    INSERT INTO tenant_acme.patent_inventors (patent_id, inventor_id, sequence)
    VALUES 
      (${patent1!.id}, ${inventor1!.id}, 1),
      (${patent1!.id}, ${inventor2!.id}, 2),
      (${patent2!.id}, ${inventor2!.id}, 1),
      (${patent2!.id}, ${inventor3!.id}, 2),
      (${patent3!.id}, ${inventor3!.id}, 1)
  `;

  await sql`
    INSERT INTO tenant_acme.patent_families (family_id, patent_id)
    VALUES 
      ('FAM-001', ${patent1!.id}),
      ('FAM-002', ${patent2!.id}),
      ('FAM-002', ${patent3!.id})
  `;

  await sql`
    INSERT INTO tenant_acme.cpc_assignments (patent_id, cpc_code, section)
    VALUES 
      (${patent1!.id}, 'H04L9/00', 'H'),
      (${patent1!.id}, 'G06F21/00', 'G'),
      (${patent2!.id}, 'G06F21/00', 'G'),
      (${patent3!.id}, 'G06F', 'G')
  `;

  await sql`
    INSERT INTO tenant_acme.cited_patents (citing_patent_id, cited_patent_number, category)
    VALUES 
      (${patent1!.id}, 'US9000000B1', 'prior-art'),
      (${patent1!.id}, 'US9111111B2', 'prior-art'),
      (${patent2!.id}, 'US8999999B1', 'prior-art'),
      (${patent3!.id}, 'US10123456B2', 'related')
  `;

  await sql`
    INSERT INTO tenant_acme.title_chains (patent_id, sequence, owner_id, effective_date, status)
    VALUES 
      (${patent1!.id}, 1, ${ibm!.id}, '2020-06-20', 'VALID'),
      (${patent2!.id}, 1, ${microsoft!.id}, '2019-09-15', 'VALID'),
      (${patent3!.id}, 1, ${google!.id}, '2019-01-25', 'VALID')
  `;

  const [lawFirm1] = await sql`
    INSERT INTO tenant_acme.law_firms (name, country)
    VALUES ('Wilson Sonsini Goodrich & Rosati', 'US')
    RETURNING id
  `;

  const [lawFirm2] = await sql`
    INSERT INTO tenant_acme.law_firms (name, country)
    VALUES ('Fish & Richardson', 'US')
    RETURNING id
  `;

  await sql`
    INSERT INTO tenant_acme.patent_law_firms (patent_id, law_firm_id, role)
    VALUES 
      (${patent1!.id}, ${lawFirm1!.id}, 'prosecution'),
      (${patent2!.id}, ${lawFirm2!.id}, 'prosecution'),
      (${patent3!.id}, ${lawFirm1!.id}, 'litigation')
  `;

  await sql`
    INSERT INTO tenant_acme.normalization_audit (entity_id, original_name, suggested_name, confidence, approved)
    VALUES 
      (${entity1!.id}, 'International Business Machines Corporation', 'IBM', 95, true),
      (${entity2!.id}, 'MICROSOFT CORP', 'Microsoft', 95, true)
  `;

  const [acmeUser] = await sql`SELECT id FROM users WHERE email = 'john.doe@acme.com'`;

  const [collection1] = await sql`
    INSERT INTO tenant_acme.collections (name, description, created_by_id)
    VALUES ('My Favorites', 'Collection of favorite patents', ${acmeUser!.id})
    RETURNING id
  `;

  await sql`
    INSERT INTO tenant_acme.collection_patents (collection_id, patent_id, added_by_id)
    VALUES 
      (${collection1!.id}, ${patent1!.id}, ${acmeUser!.id}),
      (${collection1!.id}, ${patent2!.id}, ${acmeUser!.id})
  `;

  await sql`
    INSERT INTO tenant_acme.comments (patent_id, user_id, content)
    VALUES 
      (${patent1!.id}, ${acmeUser!.id}, 'This patent has interesting implications for our security product.'),
      (${patent2!.id}, ${acmeUser!.id}, 'Need to review the claims more carefully.')
  `;

  await sql`
    INSERT INTO tenant_acme.activity_log (user_id, action, resource_type, resource_id, metadata)
    VALUES 
      (${acmeUser!.id}, 'view', 'patent', ${patent1!.id}, '{"source": "search"}'),
      (${acmeUser!.id}, 'view', 'patent', ${patent2!.id}, '{"source": "search"}'),
      (${acmeUser!.id}, 'comment', 'patent', ${patent1!.id}, '{"comment_id": "some-uuid"}')
  `;

  await sql`SET search_path TO public`;

  logger.info('Seeding tenant-specific data for TechVentures');

  await sql`SET search_path TO tenant_techventures, public`;

  const [apple] = await sql`
    INSERT INTO tenant_techventures.companies (name, normalized_name, country)
    VALUES ('Apple Inc.', 'Apple', 'US')
    RETURNING id
  `;

  const [samsung] = await sql`
    INSERT INTO tenant_techventures.companies (name, normalized_name, country)
    VALUES ('Samsung Electronics Co., Ltd.', 'Samsung', 'KR')
    RETURNING id
  `;

  const [tvPatent1] = await sql`
    INSERT INTO tenant_techventures.patents (patent_number, title, abstract, filing_date, issue_date, expiration_date, status, current_owner_id)
    VALUES (
      'US11000001B2',
      'Mobile device touch interface',
      'Improved touch interface for mobile devices with haptic feedback.',
      '2019-02-14',
      '2021-08-10',
      '2041-08-10',
      'ACTIVE',
      ${apple!.id}
    )
    RETURNING id
  `;

  const [tvPatent2] = await sql`
    INSERT INTO tenant_techventures.patents (patent_number, title, abstract, filing_date, issue_date, expiration_date, status, current_owner_id)
    VALUES (
      'US11000002B1',
      'Display panel with curved edges',
      'Manufacturing method for curved edge display panels.',
      '2018-11-05',
      '2021-05-20',
      '2041-05-20',
      'ACTIVE',
      ${samsung!.id}
    )
    RETURNING id
  `;

  const [tvInventor1] = await sql`
    INSERT INTO tenant_techventures.inventors (first_name, last_name, country)
    VALUES ('David', 'Lee', 'US')
    RETURNING id
  `;

  await sql`
    INSERT INTO tenant_techventures.patent_inventors (patent_id, inventor_id, sequence)
    VALUES 
      (${tvPatent1!.id}, ${tvInventor1!.id}, 1),
      (${tvPatent2!.id}, ${tvInventor1!.id}, 1)
  `;

  await sql`
    INSERT INTO tenant_techventures.cpc_assignments (patent_id, cpc_code, section)
    VALUES 
      (${tvPatent1!.id}, 'G06F', 'G'),
      (${tvPatent2!.id}, 'H04', 'H')
  `;

  await sql`SET search_path TO public`;

  logger.info('Database seeding completed successfully');
}

seed()
  .then(() => {
    logger.info('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed', { error });
    process.exit(1);
  });
