/**
 * Simple logging utility wrapper
 * Allows for environment-based control of logging levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default: enable logs in dev, disable in prod
const isProduction = import.meta.env.PROD;
const defaultEnabled = !isProduction;
const defaultMinLevel: LogLevel = 'info';

// Create config (can be overridden)
let config: LoggerConfig = {
  enabled: defaultEnabled,
  minLevel: defaultMinLevel,
};

/**
 * Configure the logger
 */
export function configureLogger(options: Partial<LoggerConfig>) {
  config = { ...config, ...options };
}

/**
 * Check if a log level should be emitted
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Add context prefix to logs (e.g., [Map], [SearchBar])
 */
function formatMessage(context: string, level: LogLevel, args: any[]): any[] {
  const prefix = `[${context}]`;
  return [prefix, ...args];
}

/**
 * Logger namespace for organized logging
 */
export function createLogger(context: string) {
  return {
    debug(...args: any[]) {
      if (shouldLog('debug')) {
        console.debug(...formatMessage(context, 'debug', args));
      }
    },
    info(...args: any[]) {
      if (shouldLog('info')) {
        console.info(...formatMessage(context, 'info', args));
      }
    },
    warn(...args: any[]) {
      if (shouldLog('warn')) {
        console.warn(...formatMessage(context, 'warn', args));
      }
    },
    error(...args: any[]) {
      if (shouldLog('error')) {
        console.error(...formatMessage(context, 'error', args));
      }
    },
  };
}

// Export a default logger
export const logger = createLogger('App');
