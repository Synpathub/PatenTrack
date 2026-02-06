import { z } from 'zod';

// Define the config schema with Zod
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().positive().default(4200),
  
  // API specific
  apiPort: z.coerce.number().int().positive().default(3001),
  apiHost: z.string().default('0.0.0.0'),
  corsOrigin: z.string().default('http://localhost:3000'),
  
  // Database
  databaseUrl: z.string().min(1),
  
  // Redis
  redisUrl: z.string().min(1),
  
  // JWT
  jwtSecret: z.string().min(1),
  jwtRefreshSecret: z.string().min(1),
  
  // Optional: Sentry
  sentryDsn: z.string().optional(),
  
  // Optional: EPO API
  epoKey: z.string().optional(),
  epoSecret: z.string().optional(),
  
  // Optional: USPTO
  usptoBulkDataUrl: z.string().url().default('https://bulkdata.uspto.gov'),
  
  // Optional: GitHub (for monitoring)
  githubToken: z.string().optional(),
  githubRepo: z.string().default('Synpathub/PatenTrack'),
  githubOwner: z.string().default('Synpathub'),
  
  // Optional: File Storage
  s3Bucket: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3Region: z.string().default('us-east-1'),
  staticFilesPath: z.string().default('/var/www/patentrack/static'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 * Fails fast if required config is missing
 */
export function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiPort: process.env.API_PORT,
    apiHost: process.env.API_HOST,
    corsOrigin: process.env.CORS_ORIGIN,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    sentryDsn: process.env.SENTRY_DSN,
    epoKey: process.env.EPO_KEY,
    epoSecret: process.env.EPO_SECRET,
    usptoBulkDataUrl: process.env.USPTO_BULK_DATA_URL,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
    githubOwner: process.env.GITHUB_OWNER,
    s3Bucket: process.env.S3_BUCKET,
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
    s3Region: process.env.S3_REGION,
    staticFilesPath: process.env.STATIC_FILES_PATH,
  };

  try {
    const config = configSchema.parse(rawConfig);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(
        `Configuration validation failed. Missing or invalid fields: ${missingFields}`
      );
    }
    throw error;
  }
}

// Singleton instance
let configInstance: Config | null = null;

/**
 * Get the global config instance (loads on first call)
 */
export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
