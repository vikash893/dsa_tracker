// ============================================================
// DSATracker API — Submission Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Verdict, SubmissionSource, Platform } from '@dsa-tracker/types';

export interface ISubmissionDoc extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  platform: Platform;
  submittedAt: Date;
  verdict: Verdict;
  executionTime?: number;
  memory?: number;
  language?: string;
  attemptNumber: number;
  source: SubmissionSource;
  suspicious: boolean;
  suspiciousReasons: string[];
  createdAt: Date;
}

const submissionSchema = new Schema<ISubmissionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    platform: { type: String, enum: Object.values(Platform), required: true },
    submittedAt: { type: Date, default: Date.now },
    verdict: { type: String, enum: Object.values(Verdict), required: true, index: true },
    executionTime: { type: Number },
    memory: { type: Number },
    language: { type: String },
    attemptNumber: { type: Number, default: 1 },
    source: { type: String, enum: Object.values(SubmissionSource), required: true },
    suspicious: { type: Boolean, default: false },
    suspiciousReasons: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } },
);

submissionSchema.index({ userId: 1, questionId: 1 });
submissionSchema.index({ userId: 1, submittedAt: -1 });

const Submission: Model<ISubmissionDoc> = mongoose.model<ISubmissionDoc>('Submission', submissionSchema);
export default Submission;
