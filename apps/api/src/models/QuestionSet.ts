// ============================================================
// DSATracker API — QuestionSet Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Difficulty } from '@dsa-tracker/types';

export interface IQuestionSetDoc extends Document {
  name: string;
  description?: string;
  difficulty: string;
  questions: mongoose.Types.ObjectId[];
  totalPoints: number;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSetSchema = new Schema<IQuestionSetDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    difficulty: { type: String, enum: [...Object.values(Difficulty), 'MIXED'], default: 'MIXED' },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalPoints: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } },
  },
);

const QuestionSet: Model<IQuestionSetDoc> = mongoose.model<IQuestionSetDoc>('QuestionSet', questionSetSchema);
export default QuestionSet;
