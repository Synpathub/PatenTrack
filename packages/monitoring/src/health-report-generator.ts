import { createLogger } from '@patentrack/shared';
import { runAllHealthChecks } from './health-checker.js';
import type { HealthCheckResult } from './health-checker.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('health-reporter');

export interface HealthReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
}

export async function generateHealthReport(): Promise<HealthReport> {
  logger.info('Generating health report');

  const checks = await runAllHealthChecks();

  const healthy = checks.filter((c) => c.status === 'healthy').length;
  const unhealthy = checks.filter((c) => c.status === 'unhealthy').length;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

  if (unhealthy === 0) {
    overallStatus = 'healthy';
  } else if (unhealthy < checks.length / 2) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    checks,
    summary: {
      total: checks.length,
      healthy,
      unhealthy,
    },
  };
}

export async function saveHealthReport(
  report: HealthReport,
  reportsDir: string = './reports'
): Promise<string> {
  logger.info('Saving health report', { reportsDir });

  try {
    await fs.mkdir(reportsDir, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const filename = `health-report-${date}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));

    logger.info('Health report saved', { filepath });

    return filepath;
  } catch (error) {
    logger.error('Failed to save health report', { error });
    throw error;
  }
}
