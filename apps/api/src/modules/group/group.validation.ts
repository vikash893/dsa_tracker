// ============================================================
// DSATracker API — Group Validation Schemas
// ============================================================

import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  maxMembers: z.number().int().min(1).max(10000).optional(),
  settings: z.object({
    allowSelfJoin: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    leaderboardVisible: z.boolean().optional(),
  }).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  maxMembers: z.number().int().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
  settings: z.object({
    allowSelfJoin: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    leaderboardVisible: z.boolean().optional(),
  }).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
