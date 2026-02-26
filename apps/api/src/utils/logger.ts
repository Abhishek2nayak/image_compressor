import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: unknown) {
  if (level === 'debug' && env.NODE_ENV === 'production') return;
  const timestamp = new Date().toISOString();
  const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍' }[level];
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](`${prefix} [${timestamp}] ${message}`, meta);
  } else {
    console[level === 'debug' ? 'log' : level](`${prefix} [${timestamp}] ${message}`);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
};
