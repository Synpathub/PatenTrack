import { getConnection } from '../utils/connection.js';
import { createLogger } from '@patentrack/shared';

const logger = createLogger({ service: 'migrations' });

async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations');

  const sql = getConnection();

  logger.info('Creating enums');

  await sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER_ADMIN', 'CUSTOMER_USER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE ingestion_job_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE ingestion_source AS ENUM ('USPTO_BULK', 'MANUAL_UPLOAD', 'API_INTEGRATION');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE transaction_type AS ENUM ('ASSIGNMENT', 'LICENSE', 'SECURITY_INTEREST', 'MERGER', 'CHANGE_OF_NAME');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE patent_status AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'ABANDONED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE title_chain_status AS ENUM ('VALID', 'DISPUTED', 'UNDER_REVIEW');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE entity_type AS ENUM ('COMPANY', 'INDIVIDUAL', 'GOVERNMENT', 'UNIVERSITY');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  logger.info('Creating public schema tables');

  await sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role user_role NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS ingestion_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      source ingestion_source NOT NULL,
      status ingestion_job_status NOT NULL DEFAULT 'PENDING',
      total_records INTEGER NOT NULL DEFAULT 0,
      processed_records INTEGER NOT NULL DEFAULT 0,
      failed_records INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      metadata TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS ingestion_jobs_tenant_id_idx ON ingestion_jobs(tenant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON ingestion_jobs(status)`;

  await sql`
    CREATE TABLE IF NOT EXISTS global_normalizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      raw_name VARCHAR(500) NOT NULL,
      normalized_name VARCHAR(500) NOT NULL,
      confidence INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS global_normalizations_raw_name_idx ON global_normalizations(raw_name)`;
  await sql`CREATE INDEX IF NOT EXISTS global_normalizations_normalized_name_idx ON global_normalizations(normalized_name)`;

  await sql`
    CREATE TABLE IF NOT EXISTS maintenance_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS maintenance_codes_code_idx ON maintenance_codes(code)`;

  await sql`
    CREATE TABLE IF NOT EXISTS cpc_hierarchy (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) NOT NULL UNIQUE,
      level VARCHAR(20) NOT NULL,
      title TEXT NOT NULL,
      parent_code VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS cpc_hierarchy_code_idx ON cpc_hierarchy(code)`;
  await sql`CREATE INDEX IF NOT EXISTS cpc_hierarchy_parent_code_idx ON cpc_hierarchy(parent_code)`;

  logger.info('Database migrations completed successfully');
}

runMigrations()
  .then(() => {
    logger.info('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed', { error });
    process.exit(1);
  });
