// ============================================================
// DSATracker — Invitation Type Definitions
// ============================================================

import { InvitationStatus, Role } from './enums.js';

export interface IInvitation {
  _id: string;
  email: string;
  name?: string;
  role: Role;
  groupId: string;
  invitedBy: string;
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

export interface CreateInvitationRequest {
  email: string;
  name?: string;
  role?: Role;
  groupId: string;
  profileUrls?: {
    leetcode?: string;
    codeforces?: string;
    codechef?: string;
    gfg?: string;
  };
}

export interface AcceptInvitationRequest {
  password: string;
  firstName: string;
  lastName: string;
}
