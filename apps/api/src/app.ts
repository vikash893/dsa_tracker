// ============================================================
// DSATracker API — Express Application Setup
// Assembles all middleware, routes, and error handling.
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import groupRoutes from './modules/group/group.routes.js';
import invitationRoutes from './modules/invitation/invitation.routes.js';
import questionRoutes from './modules/question/question.routes.js';
import assignmentRoutes from './modules/assignment/assignment.routes.js';
import sessionRoutes from './modules/session/session.routes.js';
import submissionRoutes from './modules/submission/submission.routes.js';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import platformRoutes from './modules/platform/platform.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

/**
 * Recursively strip keys starting with '$' or containing '.'
 * to prevent MongoDB operator injection on mutable request objects.
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

const app = express();

// ─── Security ───────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  env.FRONTEND_URL,
  'https://dsatracker-web.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, extension background worker)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.startsWith('chrome-extension://')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// ─── Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Sanitization ───────────────────────────────────────────
app.use(mongoSanitize);

// ─── Logging ────────────────────────────────────────────────
app.use(requestLogger);

// ─── Rate Limiting ──────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

export default app;
