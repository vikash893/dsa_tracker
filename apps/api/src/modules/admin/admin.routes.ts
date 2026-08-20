// ============================================================
// DSATracker API — Admin Module (Audit Logs + System Settings)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import AuditLog from '../../models/AuditLog.js';
import User from '../../models/User.js';
import Question from '../../models/Question.js';
import Submission from '../../models/Submission.js';
import Group from '../../models/Group.js';
import { SystemSetting } from '../../models/RemainingModels.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.js';
import { PAGINATION } from '../../config/constants.js';

// ─── Audit Logs ─────────────────────────────────────────────

async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
    const filter: Record<string, unknown> = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.actorId) filter.actorId = req.query.actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

// ─── System Settings ────────────────────────────────────────

async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await SystemSetting.find();
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
}

async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body as { key: string; value: unknown; category?: string; description?: string }[];
    for (const { key, value, category, description } of updates) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value, category, description, updatedBy: req.user!._id },
        { upsert: true, new: true },
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) { next(error); }
}

// ─── Admin Dashboard Stats ─────────────────────────────────

async function dashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalAdmins, totalGroups, totalQuestions, totalSubmissions] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }),
      Group.countDocuments({ isActive: true }),
      Question.countDocuments({ isActive: true }),
      Submission.countDocuments(),
    ]);

    // Recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentSubmissions, recentUsers] = await Promise.all([
      Submission.countDocuments({ submittedAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalAdmins, totalGroups, totalQuestions, totalSubmissions,
        recentActivity: { submissionsLast7Days: recentSubmissions, newUsersLast7Days: recentUsers },
      },
    });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.get('/audit-logs', requireAdmin, getAuditLogs);
router.get('/stats', requireAdmin, dashboardStats);
router.get('/system-settings', requireSuperAdmin, getSettings);
router.patch('/system-settings', requireSuperAdmin, updateSettings);

export default router;
