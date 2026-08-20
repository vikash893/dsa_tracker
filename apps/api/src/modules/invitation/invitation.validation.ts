// ============================================================
// DSATracker API — Invitation Validation Schemas
// ============================================================

import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  name: z.string().max(100).trim().optional(),
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
  groupId: z.string().min(1, 'Group ID is required'),
  profileUrls: z.object({
    leetcode: z.string().url().optional(),
    codeforces: z.string().url().optional(),
    codechef: z.string().url().optional(),
    gfg: z.string().url().optional(),
  }).optional(),
});

export const acceptInvitationSchema = z.object({
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
    'Password must contain uppercase, lowercase, number, and special character',
  ),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
