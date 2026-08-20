// ============================================================
// DSATracker API — Notification Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from '../../models/RemainingModels.js';
import { authenticate } from '../../middleware/auth.js';
import { PAGINATION } from '../../config/constants.js';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (req.query.unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user!._id, isRead: false }),
    ]);

    res.json({ success: true, data: notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!._id }, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) { next(error); }
}

async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
}

const router = Router();
router.use(authenticate);

router.get('/', list);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
