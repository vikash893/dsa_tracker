// ============================================================
// DSATracker API — Health Check Route
// ============================================================

import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../../config/database.js';
import type { HealthResponse } from '@dsa-tracker/types';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  const health: HealthResponse = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
    },
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
