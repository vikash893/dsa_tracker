// ============================================================
// DSATracker API — Question Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { questionService } from './question.service.js';
import { PAGINATION } from '../../config/constants.js';
import fs from 'fs';

export class QuestionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionService.create(req.body, req.user!);
      res.status(201).json({ success: true, data: question });
    } catch (error) { next(error); }
  }

  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await questionService.createBulk(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: `Successfully imported ${result.imported} question(s)${result.duplicates ? `, skipped ${result.duplicates} duplicate(s)` : ''}${result.failed ? `, ${result.failed} failed` : ''}`,
        data: result,
      });
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await questionService.list({
        page: parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE,
        limit: parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
        search: req.query.search as string,
        platform: req.query.platform as string,
        difficulty: req.query.difficulty as string,
        topic: req.query.topic as string,
        company: req.query.company as string,
      });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionService.getById(req.params.id as string);
      res.json({ success: true, data: question });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionService.update(req.params.id as string, req.body, req.user!);
      res.json({ success: true, data: question });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await questionService.delete(req.params.id as string, req.user!);
      res.json({ success: true, message: 'Question deleted' });
    } catch (error) { next(error); }
  }

  async importFromUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await questionService.importFromUrl(req.body, req.user!);
      res.status(201).json({ success: true, message: 'Question imported from URL', data: result });
    } catch (error) { next(error); }
  }

  async importBulkUrls(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await questionService.importBulkUrls(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: `Successfully imported ${result.imported} question(s)${result.duplicates ? `, skipped ${result.duplicates} duplicate(s)` : ''}${result.failed ? `, ${result.failed} failed` : ''}`,
        data: result,
      });
    } catch (error) { next(error); }
  }

  async importFromCsv(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'CSV file is required' });
        return;
      }
      const content = fs.readFileSync(req.file.path, 'utf-8');
      const result = await questionService.importFromCsv(content, req.user!);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.json({ success: true, message: 'CSV import complete', data: result });
    } catch (error) { next(error); }
  }

  async importFromPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'PDF file is required' });
        return;
      }
      const buffer = fs.readFileSync(req.file.path);
      const result = await questionService.extractFromPdf(buffer);
      fs.unlinkSync(req.file.path);
      res.json({
        success: true,
        message: 'PDF extraction complete. Review and confirm questions.',
        data: result,
      });
    } catch (error) { next(error); }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(400).json({ success: false, message: 'Search query (q) is required' });
        return;
      }
      const results = await questionService.search(q, {
        platform: req.query.platform as string,
        difficulty: req.query.difficulty as string,
      });
      res.json({ success: true, data: results });
    } catch (error) { next(error); }
  }

  // ─── Question Sets ────────────────────────────────────────

  async createSet(req: Request, res: Response, next: NextFunction) {
    try {
      const set = await questionService.createSet(req.body, req.user!);
      res.status(201).json({ success: true, data: set });
    } catch (error) { next(error); }
  }

  async listSets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
      const result = await questionService.listSets(page, limit);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getSet(req: Request, res: Response, next: NextFunction) {
    try {
      const set = await questionService.getSet(req.params.id as string);
      res.json({ success: true, data: set });
    } catch (error) { next(error); }
  }

  async updateSet(req: Request, res: Response, next: NextFunction) {
    try {
      const set = await questionService.updateSet(req.params.id as string, req.body, req.user!);
      res.json({ success: true, data: set });
    } catch (error) { next(error); }
  }

  async deleteSet(req: Request, res: Response, next: NextFunction) {
    try {
      await questionService.deleteSet(req.params.id as string);
      res.json({ success: true, message: 'Question set deleted' });
    } catch (error) { next(error); }
  }
}

export const questionController = new QuestionController();
