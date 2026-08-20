// ============================================================
// DSATracker API — Question Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Difficulty, Platform } from '@dsa-tracker/types';

export interface IQuestionDoc extends Document {
  title: string;
  slug: string;
  description?: string;
  platform: Platform;
  problemUrl?: string;
  externalProblemId?: string;
  difficulty: Difficulty;
  topics: string[];
  tags: string[];
  companies: string[];
  source?: string;
  expectedTime?: number;
  points: number;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestionDoc>(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 300 },
    slug: { type: String, trim: true, lowercase: true, index: true },
    description: { type: String, maxlength: 5000 },
    platform: { type: String, enum: Object.values(Platform), required: true, index: true },
    problemUrl: { type: String, trim: true },
    externalProblemId: { type: String, trim: true },
    difficulty: { type: String, enum: Object.values(Difficulty), required: true, index: true },
    topics: { type: [String], default: [], index: true },
    tags: { type: [String], default: [] },
    companies: { type: [String], default: [], index: true },
    source: { type: String },
    expectedTime: { type: Number, min: 1 },  // minutes
    points: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } },
  },
);

// Duplicate detection: unique per platform + external ID
questionSchema.index(
  { platform: 1, externalProblemId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { externalProblemId: { $exists: true, $ne: '' } } },
);

// Text index for search
questionSchema.index({ title: 'text', description: 'text' });

// Auto-generate slug from title
questionSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 200);
  }
  next();
});

const Question: Model<IQuestionDoc> = mongoose.model<IQuestionDoc>('Question', questionSchema);
export default Question;
