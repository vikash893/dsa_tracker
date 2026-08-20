// ============================================================
// DSATracker API — Analytics Module
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import Submission from '../../models/Submission.js';
import Assignment from '../../models/Assignment.js';
import SolvingSession from '../../models/SolvingSession.js';
import User from '../../models/User.js';
import Question from '../../models/Question.js';
import GroupMember from '../../models/GroupMember.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.js';
import { Verdict } from '@dsa-tracker/types';

// ─── Personal Analytics ─────────────────────────────────────

async function getPersonalAnalytics(userId: string) {
  const [
    totalAssignments, solvedAssignments,
    totalSubmissions, acceptedSubmissions,
    sessions, user,
  ] = await Promise.all([
    Assignment.countDocuments({ userId }),
    Assignment.countDocuments({ userId, status: 'SOLVED' }),
    Submission.countDocuments({ userId }),
    Submission.countDocuments({ userId, verdict: Verdict.ACCEPTED }),
    SolvingSession.find({ userId, status: 'COMPLETED' }).select('activeDuration'),
    User.findById(userId),
  ]);

  // Difficulty distribution
  const difficultyDist = await Submission.aggregate([
    { $match: { userId: user?._id, verdict: Verdict.ACCEPTED } },
    { $group: { _id: { questionId: '$questionId' } } },
    { $lookup: { from: 'questions', localField: '_id.questionId', foreignField: '_id', as: 'q' } },
    { $unwind: '$q' },
    { $group: { _id: '$q.difficulty', count: { $sum: 1 } } },
  ]);

  // Topic distribution
  const topicDist = await Submission.aggregate([
    { $match: { userId: user?._id, verdict: Verdict.ACCEPTED } },
    { $group: { _id: '$questionId' } },
    { $lookup: { from: 'questions', localField: '_id', foreignField: '_id', as: 'q' } },
    { $unwind: '$q' },
    { $unwind: '$q.topics' },
    { $group: { _id: '$q.topics', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Daily activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyActivity = await Submission.aggregate([
    { $match: { userId: user?._id, verdict: Verdict.ACCEPTED, submittedAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const avgSolvingTime = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.activeDuration, 0) / sessions.length / 60)
    : 0;

  const uniqueSolved = await Submission.distinct('questionId', { userId: user?._id, verdict: Verdict.ACCEPTED });

  return {
    totalQuestions: totalAssignments,
    solved: uniqueSolved.length,
    remaining: totalAssignments - solvedAssignments,
    accuracy: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
    avgSolvingTime,
    currentStreak: user?.currentStreak || 0,
    longestStreak: user?.longestStreak || 0,
    xp: user?.xp || 0,
    level: user?.level || 1,
    difficultyDistribution: difficultyDist,
    topicDistribution: topicDist.slice(0, 15),
    dailyActivity,
    weakTopics: topicDist.filter((t: { count: number }) => t.count <= 2).map((t: { _id: string }) => t._id).slice(0, 5),
    strongTopics: topicDist.slice(0, 5).map((t: { _id: string }) => t._id),
  };
}

// ─── Admin Analytics ────────────────────────────────────────

async function getAdminAnalytics() {
  const [totalUsers, activeUsers, totalQuestions, totalSubmissions, totalAccepted] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Question.countDocuments({ isActive: true }),
    Submission.countDocuments(),
    Submission.countDocuments({ verdict: Verdict.ACCEPTED }),
  ]);

  // Most solved questions
  const mostSolved = await Submission.aggregate([
    { $match: { verdict: Verdict.ACCEPTED } },
    { $group: { _id: '$questionId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'questions', localField: '_id', foreignField: '_id', as: 'q' } },
    { $unwind: '$q' },
    { $project: { title: '$q.title', platform: '$q.platform', difficulty: '$q.difficulty', solveCount: '$count' } },
  ]);

  // Platform distribution
  const platformDist = await Question.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$platform', count: { $sum: 1 } } },
  ]);

  return {
    totalUsers, activeUsers, totalQuestions, totalSubmissions,
    completionRate: totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0,
    mostSolvedQuestions: mostSolved,
    platformDistribution: platformDist,
  };
}

// ─── Handlers ───────────────────────────────────────────────

async function personalAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPersonalAnalytics(req.user!._id.toString());
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

async function userAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPersonalAnalytics(req.params.id as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

async function groupAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await GroupMember.find({ groupId: req.params.id as string }).populate('userId', 'firstName lastName email');
    const memberAnalytics = await Promise.all(
      members.map(async (m) => {
        const analytics = await getPersonalAnalytics(m.userId.toString());
        return { user: m.userId, ...analytics };
      }),
    );
    res.json({ success: true, data: { members: memberAnalytics, totalMembers: members.length } });
  } catch (error) { next(error); }
}

async function adminAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAdminAnalytics();
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

// ─── Routes ─────────────────────────────────────────────────

const router = Router();
router.use(authenticate);

router.get('/me', personalAnalytics);
router.get('/user/:id', requireAdmin, userAnalytics);
router.get('/group/:id', requireAdmin, groupAnalytics);
router.get('/platform', requireSuperAdmin, adminAnalytics);

export default router;
