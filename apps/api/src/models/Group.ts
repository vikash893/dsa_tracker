// ============================================================
// DSATracker API — Group Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IGroupDoc extends Document {
  name: string;
  description?: string;
  code: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  maxMembers: number;
  settings: {
    allowSelfJoin?: boolean;
    requireApproval?: boolean;
    leaderboardVisible?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const groupSettingsSchema = new Schema(
  {
    allowSelfJoin: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    leaderboardVisible: { type: Boolean, default: true },
  },
  { _id: false },
);

const groupSchema = new Schema<IGroupDoc>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 500 },
    code: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 100, min: 1 },
    settings: { type: groupSettingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } },
  },
);

const Group: Model<IGroupDoc> = mongoose.model<IGroupDoc>('Group', groupSchema);
export default Group;
