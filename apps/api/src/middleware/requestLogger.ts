// ============================================================
// DSATracker API — Request Logger
// Structured request logging with morgan.
// ============================================================

import morgan from 'morgan';
import { env } from '../config/env.js';

/**
 * HTTP request logger.
 * - Development: colored, short format
 * - Production: combined format
 */
export const requestLogger = morgan(
  env.NODE_ENV === 'development' ? 'dev' : 'combined',
  {
    skip: (req) => req.url === '/api/health', // Don't log health checks
  },
);
