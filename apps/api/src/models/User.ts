// ============================================================
// DSATracker API — User Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role } from '@dsa-tracker/types';

export interface IUserDoc extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: {
    token: string;
    device?: string;
    createdAt: Date;
    expiresAt: Date;
  }[];
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate?: Date;
  settings: {
    theme?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    chromeNotifications?: boolean;
    inactivityTimeout?: number;
    anonymousLeaderboard?: boolean;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    device: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSettingsSchema = new Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    emailNotifications: { type: Boolean, default: true },
    chromeNotifications: { type: Boolean, default: true },
    inactivityTimeout: { type: Number, default: 5 }, // minutes
    anonymousLeaderboard: { type: Boolean, default: false },
    timezone: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatar: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: {
      type: [refreshTokenSchema],
      select: false,
      default: [],
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSolvedDate: { type: Date },
    settings: {
      type: userSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Strip sensitive fields when serializing
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Virtual: full name
userSchema.virtual('fullName').get(function (this: IUserDoc) {
  return `${this.firstName} ${this.lastName}`;
});

const User: Model<IUserDoc> = mongoose.model<IUserDoc>('User', userSchema);

export default User;
