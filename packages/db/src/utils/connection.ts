import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { loadConfig } from '@patentrack/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let sql: ReturnType<typeof postgres> | null = null;
let db: PostgresJsDatabase | null = null;

export function getConnection(): ReturnType<typeof postgres> {
  if (!sql) {
    const config = loadConfig();
    sql = postgres(config.databaseUrl, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sql;
}

export function getDb(): PostgresJsDatabase {
  if (!db) {
    const connection = getConnection();
    db = drizzle(connection);
  }
  return db;
}

export async function withTenantSchema<T>(
  tenantSlug: string,
  callback: (db: PostgresJsDatabase, schema: string) => Promise<T>
): Promise<T> {
  const connection = getConnection();
  const database = getDb();
  const schemaName = `tenant_${tenantSlug}`;

  await connection`SET search_path TO ${connection(schemaName)}, public`;

  try {
    const result = await callback(database, schemaName);
    return result;
  } finally {
    await connection`SET search_path TO public`;
  }
}

export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
  }
}
