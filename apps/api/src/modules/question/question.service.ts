// ============================================================
// DSATracker API — Question Service
// Handles CRUD, search, duplicate detection, and imports.
// ============================================================

import Question, { IQuestionDoc } from '../../models/Question.js';
import QuestionSet from '../../models/QuestionSet.js';
import AuditLog from '../../models/AuditLog.js';
import { AppError } from '../../utils/AppError.js';
import { detectPlatformFromUrl } from '../../utils/platformDetector.js';
import { parseCsvContent } from '../../utils/fileParser.js';
import { AuditAction, Difficulty, Platform } from '@dsa-tracker/types';
import { PAGINATION, DEFAULT_SCORING } from '../../config/constants.js';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
  ImportUrlInput,
  CreateQuestionSetInput,
  BulkCreateQuestionsInput,
  ImportBulkUrlsInput,
} from './question.validation.js';
import type { IUserDoc } from '../../models/User.js';

export class QuestionService {
  // ─── CRUD ─────────────────────────────────────────────────

  async create(data: CreateQuestionInput, user: IUserDoc): Promise<IQuestionDoc> {
    // Duplicate detection
    if (data.externalProblemId && data.platform !== 'CUSTOM') {
      const existing = await Question.findOne({
        platform: data.platform,
        externalProblemId: data.externalProblemId,
      });
      if (existing) throw AppError.conflict(`Question already exists: "${existing.title}"`);
    }

    // Auto-calculate points from difficulty if not provided
    const points = data.points ?? DEFAULT_SCORING.difficultyPoints[data.difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] ?? 0;

    const question = await Question.create({ ...data, points, createdBy: user._id });

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.QUESTION_CREATED,
      targetType: 'Question',
      targetId: question._id,
      metadata: { title: question.title, platform: question.platform },
    });

    return question;
  }

  async createBulk(data: BulkCreateQuestionsInput, user: IUserDoc) {
    const rawQuestions: CreateQuestionInput[] = Array.isArray(data) ? data : data.questions;
    const created: IQuestionDoc[] = [];
    const errors: { index: number; title?: string; message: string }[] = [];
    let duplicates = 0;
    let failed = 0;

    for (let i = 0; i < rawQuestions.length; i++) {
      const item = rawQuestions[i]!;
      try {
        let { platform, externalProblemId, title, problemUrl } = item;
        let slug: string | undefined = undefined;

        // Auto-detect platform and external problem details if URL is provided
        if (problemUrl && (!platform || platform === 'CUSTOM' || !externalProblemId)) {
          const detected = detectPlatformFromUrl(problemUrl);
          if (detected) {
            platform = detected.platform;
            externalProblemId = detected.externalProblemId;
            if (detected.slug) slug = detected.slug;
            if (!title && detected.title) title = detected.title;
          }
        }

        // Duplicate check by platform + externalProblemId
        if (externalProblemId && platform !== 'CUSTOM') {
          const existing = await Question.findOne({ platform, externalProblemId });
          if (existing) {
            duplicates++;
            continue;
          }
        }

        // Duplicate check by title + platform
        if (title) {
          const titleDup = await Question.findOne({
            title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
            platform,
          });
          if (titleDup) {
            duplicates++;
            continue;
          }
        }

        const difficulty = item.difficulty || Difficulty.MEDIUM;
        const points = item.points ?? DEFAULT_SCORING.difficultyPoints[difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] ?? 0;

        const question = await Question.create({
          ...item,
          title: title || 'Untitled Problem',
          platform: platform || Platform.CUSTOM,
          externalProblemId,
          slug,
          difficulty,
          points,
          createdBy: user._id,
        });

        created.push(question);
      } catch (err) {
        failed++;
        errors.push({
          index: i + 1,
          title: item.title,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (created.length > 0) {
      await AuditLog.create({
        actorId: user._id,
        action: AuditAction.QUESTIONS_IMPORTED,
        targetType: 'Question',
        metadata: {
          source: 'bulk_create',
          count: created.length,
          duplicates,
          failed,
          total: rawQuestions.length,
        },
      });
    }

    return {
      imported: created.length,
      duplicates,
      failed,
      total: rawQuestions.length,
      questions: created,
      errors,
    };
  }

  async list(filters: {
    page?: number; limit?: number; search?: string;
    platform?: string; difficulty?: string; topic?: string;
    company?: string; isActive?: boolean;
  }) {
    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(filters.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filters.platform) query.platform = filters.platform;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.topic) query.topics = filters.topic;
    if (filters.company) query.companies = { $regex: filters.company, $options: 'i' };
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { topics: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(query),
    ]);

    return {
      data: questions,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id: string) {
    const question = await Question.findById(id).populate('createdBy', 'firstName lastName');
    if (!question) throw AppError.notFound('Question not found');
    return question;
  }

  async update(id: string, data: UpdateQuestionInput, user: IUserDoc) {
    const question = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!question) throw AppError.notFound('Question not found');

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.QUESTION_UPDATED,
      targetType: 'Question',
      targetId: id,
      metadata: data,
    });

    return question;
  }

  async delete(id: string, user: IUserDoc) {
    const question = await Question.findById(id);
    if (!question) throw AppError.notFound('Question not found');

    question.isActive = false;
    await question.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.QUESTION_DELETED,
      targetType: 'Question',
      targetId: id,
    });
  }

  // ─── Import from URL ─────────────────────────────────────

  async importFromUrl(data: ImportUrlInput, user: IUserDoc) {
    const detected = detectPlatformFromUrl(data.url);
    if (!detected) {
      throw AppError.badRequest('Could not detect platform from URL. Supported: LeetCode, Codeforces, CodeChef, GFG');
    }

    // Duplicate check
    if (detected.externalProblemId) {
      const existing = await Question.findOne({
        platform: detected.platform,
        externalProblemId: detected.externalProblemId,
      });
      if (existing) throw AppError.conflict(`Question already exists: "${existing.title}"`);
    }

    const difficulty = data.difficulty || Difficulty.MEDIUM;
    const points = data.points ?? DEFAULT_SCORING.difficultyPoints[difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] ?? 0;

    const question = await Question.create({
      title: detected.title || 'Untitled Problem',
      slug: detected.slug,
      platform: detected.platform,
      problemUrl: data.url,
      externalProblemId: detected.externalProblemId,
      difficulty,
      topics: data.topics || [],
      companies: data.companies || [],
      points,
      createdBy: user._id,
    });

    return { question, detected };
  }

  async importBulkUrls(data: ImportBulkUrlsInput, user: IUserDoc) {
    const created: IQuestionDoc[] = [];
    const errors: { index: number; url: string; message: string }[] = [];
    let duplicates = 0;
    let failed = 0;

    const difficulty = data.defaultDifficulty || Difficulty.MEDIUM;
    const points = data.points ?? DEFAULT_SCORING.difficultyPoints[difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] ?? 0;

    for (let i = 0; i < data.urls.length; i++) {
      const url = data.urls[i]!.trim();
      if (!url) continue;

      try {
        const detected = detectPlatformFromUrl(url);
        if (!detected) {
          failed++;
          errors.push({ index: i + 1, url, message: 'Could not detect platform from URL' });
          continue;
        }

        // Duplicate check by platform + externalProblemId
        if (detected.externalProblemId) {
          const existing = await Question.findOne({
            platform: detected.platform,
            externalProblemId: detected.externalProblemId,
          });
          if (existing) {
            duplicates++;
            continue;
          }
        }

        // Duplicate check by problemUrl
        const existingByUrl = await Question.findOne({ problemUrl: url });
        if (existingByUrl) {
          duplicates++;
          continue;
        }

        const question = await Question.create({
          title: detected.title || 'Untitled Problem',
          slug: detected.slug,
          platform: detected.platform,
          problemUrl: url,
          externalProblemId: detected.externalProblemId,
          difficulty,
          topics: data.topics || [],
          companies: data.companies || [],
          points,
          createdBy: user._id,
        });

        created.push(question);
      } catch (err) {
        failed++;
        errors.push({
          index: i + 1,
          url,
          message: err instanceof Error ? err.message : 'Failed to import problem',
        });
      }
    }

    if (created.length > 0) {
      await AuditLog.create({
        actorId: user._id,
        action: AuditAction.QUESTIONS_IMPORTED,
        targetType: 'Question',
        metadata: {
          source: 'bulk_urls',
          count: created.length,
          duplicates,
          failed,
          total: data.urls.length,
        },
      });
    }

    return {
      imported: created.length,
      duplicates,
      failed,
      total: data.urls.length,
      questions: created,
      errors,
    };
  }

  // ─── Import from CSV ─────────────────────────────────────

  async importFromCsv(fileContent: string, user: IUserDoc) {
    const parseResult = parseCsvContent(fileContent);

    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    const importErrors: { row: number; title?: string; message: string }[] = parseResult.errors.map(e => ({ row: e.row, message: e.message }));

    for (let i = 0; i < parseResult.questions.length; i++) {
      const q = parseResult.questions[i]!;
      try {
        // Duplicate check by URL
        if (q.url) {
          const detected = detectPlatformFromUrl(q.url);
          if (detected?.externalProblemId) {
            const existing = await Question.findOne({
              platform: detected.platform,
              externalProblemId: detected.externalProblemId,
            });
            if (existing) {
              duplicates++;
              continue;
            }
          }
        }

        // Duplicate check by title + platform
        const titleDup = await Question.findOne({
          title: { $regex: `^${q.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          platform: q.platform,
        });
        if (titleDup) {
          duplicates++;
          continue;
        }

        const difficulty = (q.difficulty as Difficulty) || Difficulty.MEDIUM;
        const points = q.points ?? DEFAULT_SCORING.difficultyPoints[difficulty as keyof typeof DEFAULT_SCORING.difficultyPoints] ?? 0;

        const detected = q.url ? detectPlatformFromUrl(q.url) : null;

        await Question.create({
          title: q.title,
          platform: q.platform || Platform.CUSTOM,
          problemUrl: q.url,
          externalProblemId: detected?.externalProblemId,
          difficulty,
          topics: q.topic ? [q.topic] : [],
          companies: q.company ? [q.company] : [],
          points,
          createdBy: user._id,
        });

        imported++;
      } catch (err) {
        failed++;
        importErrors.push({
          row: i + 2,
          title: q.title,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.QUESTIONS_IMPORTED,
      targetType: 'Question',
      metadata: { source: 'csv', imported, duplicates, failed, totalRows: parseResult.totalRows },
    });

    return { imported, duplicates, failed, totalRows: parseResult.totalRows, errors: importErrors };
  }

  // ─── Import from PDF (extraction preview) ─────────────────

  async extractFromPdf(fileBuffer: Buffer) {
    // pdf-parse is an optional dependency. We provide a basic extraction.
    // In production, use pdf-parse or a more robust library.
    try {
      const text = fileBuffer.toString('utf-8'); // Basic fallback for text-based PDFs
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      const extractedQuestions: { title: string; url?: string; platform?: string }[] = [];
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      for (const line of lines) {
        const urls = line.match(urlRegex);
        if (urls) {
          for (const url of urls) {
            const detected = detectPlatformFromUrl(url);
            if (detected) {
              extractedQuestions.push({
                title: detected.title || line.replace(url, '').trim() || 'Untitled',
                url,
                platform: detected.platform,
              });
            }
          }
        }
      }

      return { extractedQuestions, rawLineCount: lines.length };
    } catch {
      throw AppError.badRequest('Failed to parse PDF. Please ensure the file is valid.');
    }
  }

  // ─── Question Sets ────────────────────────────────────────

  async createSet(data: CreateQuestionSetInput, user: IUserDoc) {
    // Calculate total points
    const questions = await Question.find({ _id: { $in: data.questionIds } });
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const set = await QuestionSet.create({
      name: data.name,
      description: data.description,
      difficulty: data.difficulty || 'MIXED',
      questions: data.questionIds,
      totalPoints,
      createdBy: user._id,
    });

    return set;
  }

  async listSets(page = 1, limit = PAGINATION.DEFAULT_LIMIT) {
    const skip = (page - 1) * limit;
    const [sets, total] = await Promise.all([
      QuestionSet.find({ isActive: true })
        .populate('questions', 'title platform difficulty points')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QuestionSet.countDocuments({ isActive: true }),
    ]);

    return {
      data: sets,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getSet(id: string) {
    const set = await QuestionSet.findById(id)
      .populate('questions')
      .populate('createdBy', 'firstName lastName');
    if (!set) throw AppError.notFound('Question set not found');
    return set;
  }

  async updateSet(id: string, data: Partial<CreateQuestionSetInput & { isActive: boolean }>, user: IUserDoc) {
    const updates: Record<string, unknown> = { ...data };
    if (data.questionIds) {
      const questions = await Question.find({ _id: { $in: data.questionIds } });
      updates.totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      updates.questions = data.questionIds;
      delete updates.questionIds;
    }

    const set = await QuestionSet.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!set) throw AppError.notFound('Question set not found');
    return set;
  }

  async deleteSet(id: string) {
    const set = await QuestionSet.findById(id);
    if (!set) throw AppError.notFound('Question set not found');
    set.isActive = false;
    await set.save();
  }

  // ─── Search ───────────────────────────────────────────────

  async search(query: string, filters?: { platform?: string; difficulty?: string }) {
    const searchQuery: Record<string, unknown> = {
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { topics: { $regex: query, $options: 'i' } },
        { companies: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    };

    if (filters?.platform) searchQuery.platform = filters.platform;
    if (filters?.difficulty) searchQuery.difficulty = filters.difficulty;

    return Question.find(searchQuery).limit(50).sort({ createdAt: -1 });
  }
}

export const questionService = new QuestionService();
