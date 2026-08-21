// ============================================================
// DSATracker API — Question Validation Schemas
// ============================================================

import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(1).max(300).trim(),
  description: z.string().max(5000).optional(),
  platform: z.enum(['LEETCODE', 'CODEFORCES', 'CODECHEF', 'GFG', 'CUSTOM']),
  problemUrl: z.string().url().optional(),
  externalProblemId: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  source: z.string().optional(),
  expectedTime: z.number().int().min(1).optional(),
  points: z.number().int().min(0).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const importUrlSchema = z.object({
  url: z.string().url('Valid URL is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  topics: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  points: z.number().int().min(0).optional(),
});

export const createQuestionSetSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']).optional(),
  questionIds: z.array(z.string()).min(1, 'At least one question is required'),
});

export const updateQuestionSetSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']).optional(),
  questionIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const bulkCreateQuestionsSchema = z.union([
  z.object({
    questions: z.array(createQuestionSchema).min(1, 'At least one question is required'),
  }),
  z.array(createQuestionSchema).min(1, 'At least one question is required'),
]);

export const importBulkUrlsSchema = z.object({
  urls: z.array(z.string().url('Invalid problem URL')).min(1, 'At least one URL is required'),
  defaultDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  topics: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  points: z.number().int().min(0).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ImportUrlInput = z.infer<typeof importUrlSchema>;
export type BulkCreateQuestionsInput = z.infer<typeof bulkCreateQuestionsSchema>;
export type ImportBulkUrlsInput = z.infer<typeof importBulkUrlsSchema>;
export type CreateQuestionSetInput = z.infer<typeof createQuestionSetSchema>;

