// Logger utility

import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
  reset: '\x1b[0m',
};

const log = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const logMessage = `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`;

  console.log(logMessage);
  if (meta) {
    console.log(meta);
  }
};

export const logger = {
  info: (message: string, meta?: any) => log('info', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  error: (message: string, meta?: any) => log('error', message, meta),
  debug: (message: string, meta?: any) => {
    if (env.server.nodeEnv === 'development') {
      log('debug', message, meta);
    }
  },
};
