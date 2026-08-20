// ============================================================
// DSATracker — Shared Enums
// ============================================================

/** User roles for RBAC */
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/** Supported coding platforms */
export enum Platform {
  LEETCODE = 'LEETCODE',
  CODEFORCES = 'CODEFORCES',
  CODECHEF = 'CODECHEF',
  GFG = 'GFG',
  CUSTOM = 'CUSTOM',
}

/** Question difficulty levels */
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/** Assignment statuses */
export enum AssignmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/** Assignment priority */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Submission verdicts */
export enum Verdict {
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILE_ERROR = 'COMPILE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/** Source of a submission record */
export enum SubmissionSource {
  EXTENSION_AUTO = 'EXTENSION_AUTO',
  EXTENSION_MANUAL = 'EXTENSION_MANUAL',
  WEB_MANUAL = 'WEB_MANUAL',
  SYNC = 'SYNC',
}

/** Solving session statuses */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

/** Leaderboard period types */
export enum LeaderboardPeriod {
  ALL_TIME = 'ALL_TIME',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/** Challenge types */
export enum ChallengeType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

/** Invitation statuses */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/** Notification types */
export enum NotificationType {
  ASSIGNMENT = 'ASSIGNMENT',
  DEADLINE = 'DEADLINE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  LEADERBOARD = 'LEADERBOARD',
  CHALLENGE = 'CHALLENGE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  STREAK = 'STREAK',
}

/** Platform profile sync status */
export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
}

/** Group member role */
export enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

/** Audit log actions */
export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_UPDATED = 'GROUP_UPDATED',
  GROUP_DELETED = 'GROUP_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  INVITATION_CREATED = 'INVITATION_CREATED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
  INVITATION_REVOKED = 'INVITATION_REVOKED',
  QUESTION_CREATED = 'QUESTION_CREATED',
  QUESTION_UPDATED = 'QUESTION_UPDATED',
  QUESTION_DELETED = 'QUESTION_DELETED',
  QUESTIONS_IMPORTED = 'QUESTIONS_IMPORTED',
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}
