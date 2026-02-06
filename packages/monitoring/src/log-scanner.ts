import { createLogger } from '@patentrack/shared';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger({ service: 'log-scanner' });

export interface LogScanResult {
  totalLines: number;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
  scannedAt: string;
}

export async function scanRecentLogs(
  logFilePath: string,
  maxLines: number = 1000
): Promise<LogScanResult> {
  logger.info('Scanning log file', { logFilePath, maxLines });

  try {
    const content = await fs.readFile(logFilePath, 'utf-8');
    const lines = content.split('\n');
    const recentLines = lines.slice(-maxLines);

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const line of recentLines) {
      if (line.toLowerCase().includes('error')) {
        errors.push(line);
      } else if (line.toLowerCase().includes('warn')) {
        warnings.push(line);
      }
    }

    return {
      totalLines: recentLines.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.slice(-10),
      warnings: warnings.slice(-10),
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to scan log file', { error: typedError, logFilePath });
    throw error;
  }
}

export async function scanAllLogs(
  logsDirectory: string
): Promise<Record<string, LogScanResult>> {
  logger.info('Scanning all logs in directory', { logsDirectory });

  try {
    const files = await fs.readdir(logsDirectory);
    const logFiles = files.filter((file) => file.endsWith('.log'));

    const results: Record<string, LogScanResult> = {};

    for (const file of logFiles) {
      const filePath = path.join(logsDirectory, file);
      results[file] = await scanRecentLogs(filePath);
    }

    return results;
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to scan logs directory', { error: typedError, logsDirectory });
    throw error;
  }
}
