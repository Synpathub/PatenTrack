import { getConnection } from './connection.js';
import { createLogger } from '@patentrack/shared';

const logger = createLogger('tenant-manager');

export async function createTenantSchema(tenantSlug: string): Promise<void> {
  const sql = getConnection();
  const schemaName = `tenant_${tenantSlug}`;

  logger.info(`Creating schema for tenant: ${schemaName}`);

  await sql`CREATE SCHEMA IF NOT EXISTS ${sql(schemaName)}`;

  logger.info(`Schema ${schemaName} created successfully`);
}

export async function dropTenantSchema(tenantSlug: string): Promise<void> {
  const sql = getConnection();
  const schemaName = `tenant_${tenantSlug}`;

  logger.warn(`Dropping schema for tenant: ${schemaName}`);

  await sql`DROP SCHEMA IF EXISTS ${sql(schemaName)} CASCADE`;

  logger.info(`Schema ${schemaName} dropped successfully`);
}

export async function listTenantSchemas(): Promise<string[]> {
  const sql = getConnection();

  const result = await sql<
    Array<{ schema_name: string }>
  >`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`;

  return result.map((row) => row.schema_name);
}

export async function runMigrationsForTenant(
  tenantSlug: string
): Promise<void> {
  const sql = getConnection();
  const schemaName = `tenant_${tenantSlug}`;

  logger.info(`Running migrations for tenant: ${schemaName}`);

  await sql`SET search_path TO ${sql(schemaName)}, public`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(500) NOT NULL,
      normalized_name VARCHAR(500),
      country VARCHAR(2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_companies_name_idx`)} ON ${sql(schemaName)}.companies(name)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_companies_normalized_name_idx`)} ON ${sql(schemaName)}.companies(normalized_name)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.patents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_number VARCHAR(50) NOT NULL UNIQUE,
      title TEXT NOT NULL,
      abstract TEXT,
      filing_date DATE,
      issue_date DATE,
      expiration_date DATE,
      status patent_status NOT NULL,
      current_owner_id UUID REFERENCES ${sql(schemaName)}.companies(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patents_patent_number_idx`)} ON ${sql(schemaName)}.patents(patent_number)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patents_status_idx`)} ON ${sql(schemaName)}.patents(status)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patents_current_owner_id_idx`)} ON ${sql(schemaName)}.patents(current_owner_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      type transaction_type NOT NULL,
      from_entity_id UUID REFERENCES ${sql(schemaName)}.companies(id),
      to_entity_id UUID REFERENCES ${sql(schemaName)}.companies(id),
      recorded_date DATE NOT NULL,
      execution_date DATE,
      conveyance_text TEXT,
      reel_frame VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_transactions_patent_id_idx`)} ON ${sql(schemaName)}.transactions(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_transactions_from_entity_id_idx`)} ON ${sql(schemaName)}.transactions(from_entity_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_transactions_to_entity_id_idx`)} ON ${sql(schemaName)}.transactions(to_entity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      raw_name VARCHAR(500) NOT NULL,
      type entity_type NOT NULL,
      country VARCHAR(2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_entities_raw_name_idx`)} ON ${sql(schemaName)}.entities(raw_name)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.normalized_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID NOT NULL REFERENCES ${sql(schemaName)}.entities(id) ON DELETE CASCADE,
      company_id UUID REFERENCES ${sql(schemaName)}.companies(id),
      normalized_name VARCHAR(500) NOT NULL,
      confidence INTEGER NOT NULL,
      method VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_normalized_entities_entity_id_idx`)} ON ${sql(schemaName)}.normalized_entities(entity_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_normalized_entities_company_id_idx`)} ON ${sql(schemaName)}.normalized_entities(company_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.inventors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      country VARCHAR(2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_inventors_last_name_idx`)} ON ${sql(schemaName)}.inventors(last_name)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.patent_inventors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      inventor_id UUID NOT NULL REFERENCES ${sql(schemaName)}.inventors(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_inventors_patent_id_idx`)} ON ${sql(schemaName)}.patent_inventors(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_inventors_inventor_id_idx`)} ON ${sql(schemaName)}.patent_inventors(inventor_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.patent_families (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id VARCHAR(100) NOT NULL,
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_families_family_id_idx`)} ON ${sql(schemaName)}.patent_families(family_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_families_patent_id_idx`)} ON ${sql(schemaName)}.patent_families(patent_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.cpc_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      cpc_code VARCHAR(50) NOT NULL,
      section VARCHAR(10) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_cpc_assignments_patent_id_idx`)} ON ${sql(schemaName)}.cpc_assignments(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_cpc_assignments_cpc_code_idx`)} ON ${sql(schemaName)}.cpc_assignments(cpc_code)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.cited_patents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      citing_patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      cited_patent_number VARCHAR(50) NOT NULL,
      category VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_cited_patents_citing_patent_id_idx`)} ON ${sql(schemaName)}.cited_patents(citing_patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_cited_patents_cited_patent_number_idx`)} ON ${sql(schemaName)}.cited_patents(cited_patent_number)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.title_chains (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      owner_id UUID REFERENCES ${sql(schemaName)}.companies(id),
      effective_date DATE NOT NULL,
      transaction_id UUID REFERENCES ${sql(schemaName)}.transactions(id),
      status title_chain_status NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_title_chains_patent_id_idx`)} ON ${sql(schemaName)}.title_chains(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_title_chains_owner_id_idx`)} ON ${sql(schemaName)}.title_chains(owner_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.share_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token VARCHAR(100) NOT NULL UNIQUE,
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      created_by_id UUID NOT NULL,
      expires_at TIMESTAMP,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_share_links_token_idx`)} ON ${sql(schemaName)}.share_links(token)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_share_links_patent_id_idx`)} ON ${sql(schemaName)}.share_links(patent_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.law_firms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(500) NOT NULL,
      country VARCHAR(2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_law_firms_name_idx`)} ON ${sql(schemaName)}.law_firms(name)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.patent_law_firms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      law_firm_id UUID NOT NULL REFERENCES ${sql(schemaName)}.law_firms(id) ON DELETE CASCADE,
      role VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_law_firms_patent_id_idx`)} ON ${sql(schemaName)}.patent_law_firms(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_patent_law_firms_law_firm_id_idx`)} ON ${sql(schemaName)}.patent_law_firms(law_firm_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.normalization_audit (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID NOT NULL REFERENCES ${sql(schemaName)}.entities(id) ON DELETE CASCADE,
      original_name VARCHAR(500) NOT NULL,
      suggested_name VARCHAR(500) NOT NULL,
      confidence INTEGER NOT NULL,
      approved_by_id UUID,
      approved BOOLEAN,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_normalization_audit_entity_id_idx`)} ON ${sql(schemaName)}.normalization_audit(entity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by_id UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_collections_created_by_id_idx`)} ON ${sql(schemaName)}.collections(created_by_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.collection_patents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection_id UUID NOT NULL REFERENCES ${sql(schemaName)}.collections(id) ON DELETE CASCADE,
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      added_by_id UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_collection_patents_collection_id_idx`)} ON ${sql(schemaName)}.collection_patents(collection_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_collection_patents_patent_id_idx`)} ON ${sql(schemaName)}.collection_patents(patent_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patent_id UUID NOT NULL REFERENCES ${sql(schemaName)}.patents(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_comments_patent_id_idx`)} ON ${sql(schemaName)}.comments(patent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_comments_user_id_idx`)} ON ${sql(schemaName)}.comments(user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.activity_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id UUID NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_activity_log_user_id_idx`)} ON ${sql(schemaName)}.activity_log(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_activity_log_resource_type_idx`)} ON ${sql(schemaName)}.activity_log(resource_type)`;
  await sql`CREATE INDEX IF NOT EXISTS ${sql(`${schemaName}_activity_log_created_at_idx`)} ON ${sql(schemaName)}.activity_log(created_at)`;

  await sql`SET search_path TO public`;

  logger.info(`Migrations completed for tenant: ${schemaName}`);
}
