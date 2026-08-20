// ============================================================
// DSATracker API — Role-Based Access Control Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { Role } from '@dsa-tracker/types';

/**
 * Factory: returns middleware that only allows specific roles.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      throw AppError.forbidden(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      );
    }

    next();
  };
}

/**
 * Shorthand: require at least ADMIN role (ADMIN or SUPER_ADMIN).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(Role.ADMIN, Role.SUPER_ADMIN)(req, res, next);
}

/**
 * Shorthand: require SUPER_ADMIN role.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(Role.SUPER_ADMIN)(req, res, next);
}
