// ============================================================
// DSATracker API — User Controller (Phase 1: basic endpoints)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import User from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import AuditLog from '../../models/AuditLog.js';
import { Role, AuditAction } from '@dsa-tracker/types';
import { hashPassword } from '../../utils/password.js';
import { PAGINATION } from '../../config/constants.js';

export class UserController {
  /**
   * List users (ADMIN+)
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
      const limit = Math.min(
        PAGINATION.MAX_LIMIT,
        Math.max(1, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT),
      );
      const skip = (page - 1) * limit;

      // Build filter
      const filter: Record<string, unknown> = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
      if (req.query.search) {
        const search = req.query.search as string;
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single user (ADMIN+)
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (ADMIN+)
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Prevent admins from modifying super admins
      const targetUser = await User.findById(id);
      if (!targetUser) throw AppError.notFound('User not found');

      if (
        targetUser.role === Role.SUPER_ADMIN &&
        req.user!.role !== Role.SUPER_ADMIN
      ) {
        throw AppError.forbidden('Cannot modify a Super Admin');
      }

      // Whitelist updatable fields
      const allowedFields = ['firstName', 'lastName', 'displayName', 'isActive'];
      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const updated = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      await AuditLog.create({
        actorId: req.user!._id,
        action: AuditAction.USER_UPDATED,
        targetType: 'User',
        targetId: id,
        metadata: updates,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user role (SUPER_ADMIN only)
   */
  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(Role).includes(role)) {
        throw AppError.badRequest('Invalid role');
      }

      const targetUser = await User.findById(id);
      if (!targetUser) throw AppError.notFound('User not found');

      // Cannot change own role
      if (targetUser._id.toString() === req.user!._id.toString()) {
        throw AppError.badRequest('Cannot change your own role');
      }

      const previousRole = targetUser.role;
      targetUser.role = role;
      await targetUser.save();

      await AuditLog.create({
        actorId: req.user!._id,
        action: AuditAction.USER_ROLE_CHANGED,
        targetType: 'User',
        targetId: id,
        metadata: { previousRole, newRole: role },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: `User role changed to ${role}`,
        data: targetUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user (SUPER_ADMIN only)
   */
  async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const targetUser = await User.findById(id);
      if (!targetUser) throw AppError.notFound('User not found');

      if (targetUser._id.toString() === req.user!._id.toString()) {
        throw AppError.badRequest('Cannot deactivate your own account');
      }

      if (targetUser.role === Role.SUPER_ADMIN) {
        throw AppError.forbidden('Cannot deactivate a Super Admin');
      }

      targetUser.isActive = false;
      await targetUser.save();

      await AuditLog.create({
        actorId: req.user!._id,
        action: AuditAction.USER_DEACTIVATED,
        targetType: 'User',
        targetId: id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'User deactivated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update own profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const allowedFields = ['firstName', 'lastName', 'displayName', 'avatar', 'settings'];
      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      // Handle password change separately
      if (req.body.newPassword) {
        updates.passwordHash = await hashPassword(req.body.newPassword);
      }

      const user = await User.findByIdAndUpdate(req.user!._id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
