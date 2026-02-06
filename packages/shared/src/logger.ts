import { pino } from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

export interface LoggerOptions {
  service: string;
  level?: string;
  isDevelopment?: boolean;
  logFilePath?: string;
}

export interface LogContext {
  traceId?: string;
  tenantId?: number;
  userId?: number;
  [key: string]: unknown;
}

export class Logger {
  private logger: PinoLogger;
  private service: string;
  private logFilePath?: string;

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.logFilePath = options.logFilePath;

    const level = options.level || (options.isDevelopment ? 'debug' : 'info');

    // Configure Pino logger
    this.logger = pino({
      level,
      base: {
        service: this.service,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string): { level: string } => {
          return { level: label };
        },
      },
      transport: options.isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    });
  }

  private logToFile(level: string, message: string, context?: LogContext): void {
    if (!this.logFilePath) return;

    try {
      const logDir = dirname(this.logFilePath);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: this.service,
        msg: message,
        ...context,
      });

      writeFileSync(this.logFilePath, logEntry + '\n', { flag: 'a' });
    } catch (error) {
      // Fail silently to avoid logging loops
      console.error('Failed to write to log file:', error);
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.logger.debug({ ...context }, message);
    this.logToFile('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.logger.info({ ...context }, message);
    this.logToFile('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.logger.warn({ ...context }, message);
    this.logToFile('warn', message, context);
  }

  public error(message: string, context?: LogContext & { error?: Error }): void {
    const errorContext = context?.error
      ? {
          ...context,
          error: {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name,
          },
        }
      : context;

    this.logger.error({ ...errorContext }, message);
    this.logToFile('error', message, errorContext);
  }

  public fatal(message: string, context?: LogContext & { error?: Error }): void {
    const errorContext = context?.error
      ? {
          ...context,
          error: {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name,
          },
        }
      : context;

    this.logger.fatal({ ...errorContext }, message);
    this.logToFile('fatal', message, errorContext);
  }

  public child(bindings: LogContext): Logger {
    const childLogger = new Logger({
      service: this.service,
      logFilePath: this.logFilePath,
    });
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}

// Factory function to create logger instances
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
