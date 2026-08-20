// ============================================================
// DSATracker API — PlatformProfile Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Platform, SyncStatus } from '@dsa-tracker/types';

export interface IPlatformProfileDoc extends Document {
  userId: mongoose.Types.ObjectId;
  platform: Platform;
  username: string;
  profileUrl?: string;
  rating?: number;
  maxRating?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  contestRating?: number;
  ranking?: number;
  acceptanceRate?: number;
  contestsParticipated?: number;
  platformSpecific?: Record<string, unknown>;
  lastSyncedAt?: Date;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

const platformProfileSchema = new Schema<IPlatformProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: Object.values(Platform), required: true },
    username: { type: String, required: true, trim: true },
    profileUrl: { type: String },
    rating: { type: Number },
    maxRating: { type: Number },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    contestRating: { type: Number },
    ranking: { type: Number },
    acceptanceRate: { type: Number },
    contestsParticipated: { type: Number, default: 0 },
    platformSpecific: { type: Schema.Types.Mixed },
    lastSyncedAt: { type: Date },
    syncStatus: { type: String, enum: Object.values(SyncStatus), default: SyncStatus.PENDING },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } },
);

platformProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });
platformProfileSchema.index({ platform: 1, username: 1 });

const PlatformProfile: Model<IPlatformProfileDoc> = mongoose.model<IPlatformProfileDoc>('PlatformProfile', platformProfileSchema);
export default PlatformProfile;
