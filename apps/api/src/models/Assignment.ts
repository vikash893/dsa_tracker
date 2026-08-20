// ============================================================
// DSATracker API — Assignment Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { AssignmentStatus, Priority } from '@dsa-tracker/types';

export interface IAssignmentDoc extends Document {
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  questionSetId?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  deadline?: Date;
  status: AssignmentStatus;
  priority: Priority;
  points: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignmentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    questionSetId: { type: Schema.Types.ObjectId, ref: 'QuestionSet' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, default: Date.now },
    deadline: { type: Date, index: true },
    status: { type: String, enum: Object.values(AssignmentStatus), default: AssignmentStatus.NOT_STARTED, index: true },
    priority: { type: String, enum: Object.values(Priority), default: Priority.MEDIUM },
    points: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => { delete r.__v; return r; } } },
);

assignmentSchema.index({ userId: 1, questionId: 1 }, { unique: true, sparse: true });
assignmentSchema.index({ userId: 1, status: 1 });

const Assignment: Model<IAssignmentDoc> = mongoose.model<IAssignmentDoc>('Assignment', assignmentSchema);
export default Assignment;
