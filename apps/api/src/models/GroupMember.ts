// ============================================================
// DSATracker API — GroupMember Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { GroupRole } from '@dsa-tracker/types';

export interface IGroupMemberDoc extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMemberDoc>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(GroupRole),
      default: GroupRole.MEMBER,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } },
  },
);

// Unique compound: one membership per user per group
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

const GroupMember: Model<IGroupMemberDoc> = mongoose.model<IGroupMemberDoc>(
  'GroupMember',
  groupMemberSchema,
);

export default GroupMember;
