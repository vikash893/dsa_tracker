// ============================================================
// DSATracker API — Invitation Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { InvitationStatus, Role } from '@dsa-tracker/types';

export interface IInvitationDoc extends Document {
  email: string;
  name?: string;
  role: Role;
  groupId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  status: InvitationStatus;
  profileUrls?: {
    leetcode?: string;
    codeforces?: string;
    codechef?: string;
    gfg?: string;
  };
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

const invitationSchema = new Schema<IInvitationDoc>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: [Role.ADMIN, Role.USER],
      default: Role.USER,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
      index: true,
    },
    profileUrls: {
      leetcode: String,
      codeforces: String,
      codechef: String,
      gfg: String,
    },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } },
  },
);

const Invitation: Model<IInvitationDoc> = mongoose.model<IInvitationDoc>(
  'Invitation',
  invitationSchema,
);

export default Invitation;
