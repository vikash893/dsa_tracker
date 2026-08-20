// ============================================================
// DSATracker API — LeaderboardEntry, Challenge, Badge, UserBadge, Notification, SystemSetting Models
// Remaining models for Phases 9-15
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { LeaderboardPeriod, ChallengeType, NotificationType } from '@dsa-tracker/types';

// ─── LeaderboardEntry ────────────────────────────────────────

export interface ILeaderboardEntryDoc extends Document {
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  period: LeaderboardPeriod;
  periodKey: string;
  rank: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  expertSolved: number;
  totalPoints: number;
  accuracy: number;
  avgSolvingTime: number;
  streak: number;
  consistencyScore: number;
  calculatedAt: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntryDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  period: { type: String, enum: Object.values(LeaderboardPeriod), required: true },
  periodKey: { type: String, required: true },
  rank: { type: Number, default: 0 },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  expertSolved: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  avgSolvingTime: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: false });

leaderboardEntrySchema.index({ groupId: 1, period: 1, periodKey: 1, rank: 1 });
leaderboardEntrySchema.index({ userId: 1, period: 1 });

export const LeaderboardEntry: Model<ILeaderboardEntryDoc> = mongoose.model<ILeaderboardEntryDoc>('LeaderboardEntry', leaderboardEntrySchema);

// ─── Challenge ────────────────────────────────────────────

export interface IChallengeDoc extends Document {
  type: ChallengeType;
  name: string;
  description?: string;
  questions: mongoose.Types.ObjectId[];
  groupId?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  scoring?: Record<string, unknown>;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const challengeSchema = new Schema<IChallengeDoc>({
  type: { type: String, enum: Object.values(ChallengeType), required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  scoring: { type: Schema.Types.Mixed },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Challenge: Model<IChallengeDoc> = mongoose.model<IChallengeDoc>('Challenge', challengeSchema);

// ─── Badge ────────────────────────────────────────────────

export interface IBadgeDoc extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  criteria: Record<string, unknown>;
  xpReward: number;
  isActive: boolean;
}

const badgeSchema = new Schema<IBadgeDoc>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  category: { type: String, default: 'general' },
  criteria: { type: Schema.Types.Mixed, required: true },
  xpReward: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
});

export const Badge: Model<IBadgeDoc> = mongoose.model<IBadgeDoc>('Badge', badgeSchema);

// ─── UserBadge ────────────────────────────────────────────

export interface IUserBadgeDoc extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  earnedAt: Date;
  metadata?: Record<string, unknown>;
}

const userBadgeSchema = new Schema<IUserBadgeDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
});

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export const UserBadge: Model<IUserBadgeDoc> = mongoose.model<IUserBadgeDoc>('UserBadge', userBadgeSchema);

// ─── Notification ─────────────────────────────────────────

export interface INotificationDoc extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotificationDoc> = mongoose.model<INotificationDoc>('Notification', notificationSchema);

// ─── SystemSetting ────────────────────────────────────────

export interface ISystemSettingDoc extends Document {
  key: string;
  value: unknown;
  category: string;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSettingDoc>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, default: 'general' },
  description: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { updatedAt: true, createdAt: false } });

export const SystemSetting: Model<ISystemSettingDoc> = mongoose.model<ISystemSettingDoc>('SystemSetting', systemSettingSchema);
