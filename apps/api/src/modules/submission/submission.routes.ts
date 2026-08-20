// ============================================================
// DSATracker API — Submission Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Submission from '../../models/Submission.js';
import Assignment from '../../models/Assignment.js';
import SolvingSession from '../../models/SolvingSession.js';
import User from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Verdict, AssignmentStatus, SessionStatus } from '@dsa-tracker/types';
import { PAGINATION } from '../../config/constants.js';

const createSubmissionSchema = z.object({
  questionId: z.string().min(1),
  assignmentId: z.string().optional(),
  platform: z.enum(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GFG', 'CUSTOM']),
  verdict: z.enum(['ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILE_ERROR', 'UNKNOWN']),
  executionTime: z.number().optional(),
  memory: z.number().optional(),
  language: z.string().optional(),
  source: z.enum(['EXTENSION_AUTO', 'EXTENSION_MANUAL', 'WEB_MANUAL', 'SYNC']),
});

// ─── Suspicious Activity Detection ─────────────────────────

function detectSuspiciousActivity(submission: z.infer<typeof createSubmissionSchema>, sessionInfo?: { activeDuration: number }) {
  const reasons: string[] = [];

  // Extremely fast solve (under 30 seconds active time)
  if (sessionInfo && sessionInfo.activeDuration < 30 && submission.verdict === 'ACCEPTED') {
    reasons.push('Extremely short solving time (<30s)');
  }

  return { suspicious: reasons.length > 0, reasons };
}

// ─── Handlers ───────────────────────────────────────────────

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as z.infer<typeof createSubmissionSchema>;
    const userId = req.user!._id;

    // Get attempt number
    const prevAttempts = await Submission.countDocuments({ userId, questionId: data.questionId });

    // Check for active session to calculate suspicious activity
    const session = await SolvingSession.findOne({
      userId, questionId: data.questionId,
      status: { $in: [SessionStatus.ACTIVE, SessionStatus.PAUSED] },
    });

    const { suspicious, reasons } = detectSuspiciousActivity(data, session ? { activeDuration: session.activeDuration } : undefined);

    const submission = await Submission.create({
      ...data,
      userId,
      attemptNumber: prevAttempts + 1,
      suspicious,
      suspiciousReasons: reasons,
    });

    // If accepted, update assignment status and end session
    if (data.verdict === Verdict.ACCEPTED) {
      if (data.assignmentId) {
        await Assignment.findByIdAndUpdate(data.assignmentId, {
          status: AssignmentStatus.SOLVED,
          completedAt: new Date(),
        });
      }

      // End active session
      if (session) {
        session.status = SessionStatus.COMPLETED;
        session.endTime = new Date();
        session.totalDuration = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
        session.events.push({ type: 'SUBMISSION_ACCEPTED', timestamp: new Date() });
        await session.save();
      }

      // Update user streak
      await updateStreak(userId.toString());
    }

    res.status(201).json({ success: true, data: submission });
  } catch (error) { next(error); }
}

async function updateStreak(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastSolved = user.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
  if (lastSolved) lastSolved.setHours(0, 0, 0, 0);

  if (!lastSolved || lastSolved.getTime() < today.getTime() - 86400000) {
    // Streak broken or first solve
    user.currentStreak = 1;
  } else if (lastSolved.getTime() < today.getTime()) {
    // Consecutive day
    user.currentStreak += 1;
  }
  // Same day — no change

  user.lastSolvedDate = new Date();
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }
  await user.save();
}

async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
    const filter: Record<string, unknown> = {};

    if (req.user!.role === 'USER') {
      filter.userId = req.user!._id;
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    if (req.query.questionId) filter.questionId = req.query.questionId;
    if (req.query.verdict) filter.verdict = req.query.verdict;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('questionId', 'title platform difficulty')
        .populate('userId', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Submission.countDocuments(filter),
    ]);

    res.json({ success: true, data: submissions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await Submission.findById(req.params.id)
      .populate('questionId').populate('userId', 'firstName lastName');
    if (!sub) throw AppError.notFound('Submission not found');
    res.json({ success: true, data: sub });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.post('/', validate({ body: createSubmissionSchema }), create);
router.get('/', listSubmissions);
router.get('/:id', getById);

export default router;
