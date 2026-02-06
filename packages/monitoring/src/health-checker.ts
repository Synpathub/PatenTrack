import { createLogger, loadConfig } from '@patentrack/shared';
import { getConnection } from '@patentrack/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';

const execAsync = promisify(exec);
const logger = createLogger('health-checker');

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  latency?: number;
  timestamp: string;
}

export async function checkApiHealth(url: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${url}/health`);
    const latency = Date.now() - start;

    if (response.ok) {
      return {
        service: 'api',
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'api',
      status: 'unhealthy',
      message: `HTTP ${response.status}`,
      latency,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'api',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const sql = getConnection();
    await sql`SELECT 1`;
    const latency = Date.now() - start;

    return {
      service: 'database',
      status: 'healthy',
      latency,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkRedisHealth(): Promise<HealthCheckResult> {
  try {
    const config = loadConfig();

    if (!config.REDIS_URL) {
      return {
        service: 'redis',
        status: 'healthy',
        message: 'Redis not configured (optional)',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'redis',
      status: 'healthy',
      message: 'Redis URL configured',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'redis',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkPm2Processes(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);

    const runningProcesses = processes.filter(
      (p: { pm2_env: { status: string } }) => p.pm2_env.status === 'online'
    );

    if (runningProcesses.length === 0) {
      return {
        service: 'pm2',
        status: 'unhealthy',
        message: 'No PM2 processes running',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'pm2',
      status: 'healthy',
      message: `${runningProcesses.length} process(es) running`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'pm2',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkDiskSpace(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}'");
    const usage = parseInt(stdout.trim().replace('%', ''));

    if (usage > 90) {
      return {
        service: 'disk',
        status: 'unhealthy',
        message: `Disk usage at ${usage}%`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'disk',
      status: 'healthy',
      message: `Disk usage at ${usage}%`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'disk',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkMemoryUsage(): Promise<HealthCheckResult> {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    if (usagePercent > 90) {
      return {
        service: 'memory',
        status: 'unhealthy',
        message: `Memory usage at ${usagePercent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      service: 'memory',
      status: 'healthy',
      message: `Memory usage at ${usagePercent.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      service: 'memory',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  logger.info('Running all health checks');

  const config = loadConfig();
  const apiUrl = `http://${config.API_HOST || 'localhost'}:${config.API_PORT || '3001'}`;

  const results = await Promise.all([
    checkApiHealth(apiUrl),
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkPm2Processes(),
    checkDiskSpace(),
    checkMemoryUsage(),
  ]);

  logger.info('Health checks completed', { results });

  return results;
}
