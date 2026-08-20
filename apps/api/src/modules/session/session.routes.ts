// ============================================================
// DSATracker API — Session Module (Solving Sessions)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import SolvingSession from '../../models/SolvingSession.js';
import Assignment from '../../models/Assignment.js';
import { AppError } from '../../utils/AppError.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { SessionStatus, AssignmentStatus } from '@dsa-tracker/types';
import { PAGINATION } from '../../config/constants.js';

const startSessionSchema = z.object({
  questionId: z.string().min(1),
  assignmentId: z.string().optional(),
  tabId: z.number().optional(),
  platform: z.enum(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GFG', 'CUSTOM']).optional(),
});

// ─── Handlers ───────────────────────────────────────────────

async function start(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for existing active session on this question
    const existing = await SolvingSession.findOne({
      userId: req.user!._id,
      questionId: req.body.questionId,
      status: { $in: [SessionStatus.ACTIVE, SessionStatus.PAUSED] },
    });
    if (existing) {
      // Return existing session instead of creating duplicate
      res.json({ success: true, message: 'Existing session resumed', data: existing });
      return;
    }

    const session = await SolvingSession.create({
      userId: req.user!._id,
      questionId: req.body.questionId,
      assignmentId: req.body.assignmentId,
      tabId: req.body.tabId,
      platform: req.body.platform,
      events: [{ type: 'SESSION_START', timestamp: new Date() }],
    });

    // Update assignment status
    if (req.body.assignmentId) {
      await Assignment.findByIdAndUpdate(req.body.assignmentId, { status: AssignmentStatus.IN_PROGRESS });
    }

    res.status(201).json({ success: true, data: session });
  } catch (error) { next(error); }
}

async function pause(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await SolvingSession.findById(req.params.id);
    if (!session) throw AppError.notFound('Session not found');
    if (session.status !== SessionStatus.ACTIVE) throw AppError.badRequest('Session is not active');

    // Calculate active time since last resume or start
    const lastResumeOrStart = session.pauses.length > 0
      ? (session.pauses[session.pauses.length - 1]!.resumedAt || session.startTime)
      : session.startTime;
    const activeSegment = Math.floor((Date.now() - new Date(lastResumeOrStart).getTime()) / 1000);
    session.activeDuration += activeSegment;

    session.pauses.push({ pausedAt: new Date(), reason: req.body.reason || 'manual' });
    session.status = SessionStatus.PAUSED;
    session.events.push({ type: 'SESSION_PAUSE', timestamp: new Date(), metadata: { reason: req.body.reason } });
    await session.save();

    res.json({ success: true, data: session });
  } catch (error) { next(error); }
}

async function resume(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await SolvingSession.findById(req.params.id);
    if (!session) throw AppError.notFound('Session not found');
    if (session.status !== SessionStatus.PAUSED) throw AppError.badRequest('Session is not paused');

    const lastPause = session.pauses[session.pauses.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      lastPause.resumedAt = new Date();
    }

    session.status = SessionStatus.ACTIVE;
    session.events.push({ type: 'SESSION_RESUME', timestamp: new Date() });
    await session.save();

    res.json({ success: true, data: session });
  } catch (error) { next(error); }
}

async function end(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await SolvingSession.findById(req.params.id);
    if (!session) throw AppError.notFound('Session not found');
    if (session.status === SessionStatus.COMPLETED) throw AppError.badRequest('Session already completed');

    const now = new Date();

    // Calculate final active duration
    if (session.status === SessionStatus.ACTIVE) {
      const lastResumeOrStart = session.pauses.length > 0
        ? (session.pauses[session.pauses.length - 1]!.resumedAt || session.startTime)
        : session.startTime;
      const activeSegment = Math.floor((now.getTime() - new Date(lastResumeOrStart).getTime()) / 1000);
      session.activeDuration += activeSegment;
    }

    session.endTime = now;
    session.totalDuration = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);
    session.status = SessionStatus.COMPLETED;
    session.events.push({ type: 'SESSION_END', timestamp: now });
    await session.save();

    res.json({ success: true, data: session });
  } catch (error) { next(error); }
}

async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.questionId) filter.questionId = req.query.questionId;

    const [sessions, total] = await Promise.all([
      SolvingSession.find(filter)
        .populate('questionId', 'title platform difficulty')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SolvingSession.countDocuments(filter),
    ]);

    res.json({ success: true, data: sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.post('/start', validate({ body: startSessionSchema }), start);
router.post('/:id/pause', pause);
router.post('/:id/resume', resume);
router.post('/:id/end', end);
router.get('/', listSessions);

export default router;
