// ============================================================
// DSATracker API — Leaderboard Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import GroupMember from '../../models/GroupMember.js';
import { authenticate } from '../../middleware/auth.js';
import { Verdict } from '@dsa-tracker/types';
import { DEFAULT_SCORING } from '../../config/constants.js';

interface LeaderboardUser {
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalPoints: number;
  accuracy: number;
  avgSolvingTime: number;
  currentStreak: number;
  rank: number;
}

async function calculateLeaderboard(userIds?: string[], dateFilter?: { $gte: Date; $lte: Date }): Promise<LeaderboardUser[]> {
  const matchStage: Record<string, unknown> = { verdict: Verdict.ACCEPTED };
  if (userIds) matchStage.userId = { $in: userIds };
  if (dateFilter) matchStage.submittedAt = dateFilter;

  // Aggregate accepted submissions grouped by user + question (deduplicate)
  const pipeline: any[] = [
    { $match: matchStage },
    { $group: {
      _id: { userId: '$userId', questionId: '$questionId' },
      firstAccepted: { $min: '$submittedAt' },
    }},
    { $lookup: { from: 'questions', localField: '_id.questionId', foreignField: '_id', as: 'question' } },
    { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
    { $group: {
      _id: '$_id.userId',
      totalSolved: { $sum: 1 },
      easySolved: { $sum: { $cond: [{ $eq: ['$question.difficulty', 'EASY'] }, 1, 0] } },
      mediumSolved: { $sum: { $cond: [{ $eq: ['$question.difficulty', 'MEDIUM'] }, 1, 0] } },
      hardSolved: { $sum: { $cond: [{ $eq: ['$question.difficulty', 'HARD'] }, 1, 0] } },
    }},
    { $sort: { totalSolved: -1 } },
  ];

  const results = await Submission.aggregate(pipeline);

  // Enrich with user info
  const userMap = new Map<string, { firstName: string; lastName: string; displayName?: string; avatar?: string; currentStreak: number }>();
  const ids = results.map((r: { _id: string }) => r._id);
  const users = await User.find({ _id: { $in: ids } }).select('firstName lastName displayName avatar currentStreak');
  for (const u of users) userMap.set(u._id.toString(), u);

  // Calculate total submissions per user for accuracy
  const totalSubmissions = await Submission.aggregate([
    { $match: { userId: { $in: ids.map((id: string) => id) }, ...(dateFilter ? { submittedAt: dateFilter } : {}) } },
    { $group: { _id: '$userId', total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'ACCEPTED'] }, 1, 0] } } } },
  ]);
  const subMap = new Map(totalSubmissions.map((s: { _id: string; total: number; accepted: number }) => [s._id.toString(), s]));

  return results.map((r: { _id: string; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number }, idx: number) => {
    const user = userMap.get(r._id.toString());
    const subs = subMap.get(r._id.toString()) as { total: number; accepted: number } | undefined;
    const sp = DEFAULT_SCORING.difficultyPoints;

    return {
      userId: r._id.toString(),
      firstName: user?.firstName || 'Unknown',
      lastName: user?.lastName || '',
      displayName: user?.displayName,
      avatar: user?.avatar,
      totalSolved: r.totalSolved,
      easySolved: r.easySolved,
      mediumSolved: r.mediumSolved,
      hardSolved: r.hardSolved,
      totalPoints: (r.easySolved * sp.EASY) + (r.mediumSolved * sp.MEDIUM) + (r.hardSolved * sp.HARD),
      accuracy: subs ? Math.round((subs.accepted / subs.total) * 100) : 0,
      avgSolvingTime: 0, // Calculated from sessions in future
      currentStreak: user?.currentStreak || 0,
      rank: idx + 1,
    };
  });
}

// ─── Handlers ───────────────────────────────────────────────

async function overall(_req: Request, res: Response, next: NextFunction) {
  try {
    const leaderboard = await calculateLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
}

async function weekly(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const leaderboard = await calculateLeaderboard(undefined, { $gte: weekStart, $lte: now });
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
}

async function monthly(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const leaderboard = await calculateLeaderboard(undefined, { $gte: monthStart, $lte: now });
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
}

async function group(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await GroupMember.find({ groupId: req.params.id });
    const userIds = members.map((m) => m.userId.toString());
    const leaderboard = await calculateLeaderboard(userIds);
    res.json({ success: true, data: leaderboard });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.get('/', overall);
router.get('/weekly', weekly);
router.get('/monthly', monthly);
router.get('/group/:id', group);

export default router;
