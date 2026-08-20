// ============================================================
// DSATracker API — Platform Profile Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import PlatformProfile from '../../models/PlatformProfile.js';
import { AppError } from '../../utils/AppError.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { SyncStatus } from '@dsa-tracker/types';

const connectProfileSchema = z.object({
  platform: z.enum(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GFG']),
  username: z.string().min(1).trim(),
  profileUrl: z.string().url().optional(),
});

async function connect(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await PlatformProfile.findOne({ userId: req.user!._id, platform: req.body.platform });
    if (existing) throw AppError.conflict(`Profile already connected for ${req.body.platform}`);

    const profile = await PlatformProfile.create({
      userId: req.user!._id,
      ...req.body,
      syncStatus: SyncStatus.PENDING,
    });

    res.status(201).json({ success: true, data: profile });
  } catch (error) { next(error); }
}

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await PlatformProfile.find({ userId: req.user!._id });
    res.json({ success: true, data: profiles });
  } catch (error) { next(error); }
}

async function sync(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await PlatformProfile.findById(req.params.id);
    if (!profile) throw AppError.notFound('Profile not found');

    // Mark as syncing — actual sync happens in a background worker (Phase 11)
    profile.syncStatus = SyncStatus.SYNCING;
    await profile.save();

    // TODO: Queue sync job via BullMQ
    // For now, simulate with a placeholder
    res.json({ success: true, message: `Sync initiated for ${profile.platform}. Data will be updated shortly.`, data: profile });
  } catch (error) { next(error); }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await PlatformProfile.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!result) throw AppError.notFound('Profile not found');
    res.json({ success: true, message: 'Platform profile removed' });
  } catch (error) { next(error); }
}

const router = Router();
router.use(authenticate);

router.post('/', validate({ body: connectProfileSchema }), connect);
router.get('/', list);
router.post('/:id/sync', sync);
router.delete('/:id', remove);

export default router;
