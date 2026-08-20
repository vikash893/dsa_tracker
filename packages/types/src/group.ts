// ============================================================
// DSATracker — Group Type Definitions
// ============================================================

import { GroupRole } from './enums.js';

export interface IGroup {
  _id: string;
  name: string;
  description?: string;
  code: string;
  createdBy: string;
  isActive: boolean;
  maxMembers: number;
  settings?: IGroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupSettings {
  allowSelfJoin?: boolean;
  requireApproval?: boolean;
  leaderboardVisible?: boolean;
}

export interface IGroupMember {
  _id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: Date;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  maxMembers?: number;
  settings?: IGroupSettings;
}

export interface AddMemberRequest {
  userId: string;
  role?: GroupRole;
}
