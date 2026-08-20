// ============================================================
// DSATracker API — SolvingSession Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { SessionStatus, Platform } from '@dsa-tracker/types';

export interface ISolvingSessionDoc extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  activeDuration: number; // seconds
  totalDuration: number;  // seconds
  pauses: { pausedAt: Date; resumedAt?: Date; reason?: string }[];
  events: { type: string; timestamp: Date; metadata?: Record<string, unknown> }[];
  status: SessionStatus;
  tabId?: number;
  platform?: Platform;
  createdAt: Date;
  updatedAt: Date;
}

const solvingSessionSchema = new Schema<ISolvingSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    activeDuration: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    pauses: [{
      pausedAt: { type: Date, required: true },
      resumedAt: { type: Date },
      reason: { type: String },
      _id: false,
    }],
    events: [{
      type: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      metadata: { type: Schema.Types.Mixed },
      _id: false,
    }],
    status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.ACTIVE },
    tabId: { type: Number },
    platform: { type: String, enum: Object.values(Platform) },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } },
);

solvingSessionSchema.index({ userId: 1, status: 1 });
solvingSessionSchema.index({ userId: 1, questionId: 1 });

const SolvingSession: Model<ISolvingSessionDoc> = mongoose.model<ISolvingSessionDoc>('SolvingSession', solvingSessionSchema);
export default SolvingSession;
