// ============================================================
// DSATracker API — Assignment Module (Service + Controller + Routes)
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Assignment from '../../models/Assignment.js';
import Question from '../../models/Question.js';
import GroupMember from '../../models/GroupMember.js';
import { AppError } from '../../utils/AppError.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { AuditAction, AssignmentStatus } from '@dsa-tracker/types';
import AuditLog from '../../models/AuditLog.js';
import { PAGINATION, DEFAULT_SCORING } from '../../config/constants.js';

// ─── Validation ─────────────────────────────────────────────

const createAssignmentSchema = z.object({
  userIds: z.array(z.string()).min(1).optional(),
  groupId: z.string().optional(),
  questionId: z.string().optional(),
  questionSetId: z.string().optional(),
  deadline: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  points: z.number().int().min(0).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SOLVED', 'FAILED', 'EXPIRED']),
});

// ─── Service ────────────────────────────────────────────────

async function createAssignments(data: z.infer<typeof createAssignmentSchema>, userId: string) {
  let targetUserIds: string[] = data.userIds || [];

  // If groupId is provided, assign to all group members
  if (data.groupId && targetUserIds.length === 0) {
    const members = await GroupMember.find({ groupId: data.groupId });
    targetUserIds = members.map((m) => m.userId.toString());
  }

  if (targetUserIds.length === 0) throw AppError.badRequest('No target users specified');
  if (!data.questionId && !data.questionSetId) throw AppError.badRequest('Question or Question Set is required');

  // Auto-calculate points
  let points = data.points ?? 0;
  if (!data.points && data.questionId) {
    const q = await Question.findById(data.questionId);
    if (q) points = q.points || DEFAULT_SCORING.difficultyPoints[q.difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] || 0;
  }

  const assignments = [];
  const skipped: string[] = [];

  for (const uid of targetUserIds) {
    // Skip duplicates
    const existing = await Assignment.findOne({ userId: uid, questionId: data.questionId });
    if (existing) { skipped.push(uid); continue; }

    assignments.push({
      userId: uid,
      groupId: data.groupId,
      questionId: data.questionId,
      questionSetId: data.questionSetId,
      assignedBy: userId,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      priority: data.priority || 'MEDIUM',
      points,
    });
  }

  const created = await Assignment.insertMany(assignments);

  await AuditLog.create({
    actorId: userId,
    action: AuditAction.ASSIGNMENT_CREATED,
    targetType: 'Assignment',
    metadata: { count: created.length, skipped: skipped.length, questionId: data.questionId },
  });

  return { created: created.length, skipped: skipped.length, assignments: created };
}

// ─── Controller ─────────────────────────────────────────────

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await createAssignments(req.body, req.user!._id.toString());
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
}

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const filter: Record<string, unknown> = {};

    // Users see their own; admins can filter by userId
    if (req.user!.role === 'USER') {
      filter.userId = req.user!._id;
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.groupId) filter.groupId = req.query.groupId;

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('questionId', 'title platform difficulty points problemUrl')
        .populate('questionSetId', 'name')
        .populate('userId', 'firstName lastName email')
        .sort({ assignedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: assignments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 },
    });
  } catch (error) { next(error); }
}

async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('questionId').populate('userId', 'firstName lastName email');
    if (!assignment) throw AppError.notFound('Assignment not found');
    res.json({ success: true, data: assignment });
  } catch (error) { next(error); }
}

async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw AppError.notFound('Assignment not found');

    assignment.status = req.body.status as AssignmentStatus;
    if (req.body.status === AssignmentStatus.SOLVED) {
      assignment.completedAt = new Date();
    }
    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.post('/', requireAdmin, validate({ body: createAssignmentSchema }), create);
router.get('/', list);
router.get('/:id', getById);
router.patch('/:id/status', validate({ body: updateStatusSchema }), updateStatus);

export default router;
