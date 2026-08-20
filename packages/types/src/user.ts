// ============================================================
// DSATracker — User Type Definitions
// ============================================================

import { Role } from './enums.js';

/** Core user shape (without password) */
export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate?: Date;
  settings?: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSettings {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  chromeNotifications?: boolean;
  inactivityTimeout?: number; // minutes
  anonymousLeaderboard?: boolean;
  timezone?: string;
}

/** Refresh token stored in the user document */
export interface IRefreshToken {
  token: string;
  device?: string;
  createdAt: Date;
  expiresAt: Date;
}

/** User with sensitive fields (server-side only) */
export interface IUserDocument extends IUser {
  passwordHash: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: IRefreshToken[];
}
