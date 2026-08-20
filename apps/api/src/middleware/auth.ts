// ============================================================
// DSATracker API — Authentication Middleware
// Verifies JWT access token from Authorization header or cookie.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import User, { IUserDoc } from '../models/User.js';
import type { JwtPayload } from '@dsa-tracker/types';

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDoc;
      jwtPayload?: JwtPayload;
    }
  }
}

/**
 * Authenticate requests via Bearer token or HTTP-only cookie.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    throw AppError.unauthorized('Access token is required');
  }

  try {
    const payload = verifyAccessToken(token);
    req.jwtPayload = payload;

    // Fetch user from DB and attach to request
    User.findById(payload.userId)
      .then((user) => {
        if (!user) {
          return next(AppError.unauthorized('User not found'));
        }
        if (!user.isActive) {
          return next(AppError.forbidden('Account is deactivated'));
        }
        req.user = user;
        next();
      })
      .catch(next);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token has expired');
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw AppError.unauthorized('Invalid access token');
    }
    throw AppError.unauthorized('Authentication failed');
  }
}

/**
 * Extract token from Authorization header or cookie.
 */
function extractToken(req: Request): string | null {
  // Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check HTTP-only cookie
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }

  return null;
}
