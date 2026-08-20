// ============================================================
// DSATracker API — Group Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { groupService } from './group.service.js';
import { PAGINATION } from '../../config/constants.js';
import { GroupRole } from '@dsa-tracker/types';

export class GroupController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupService.create(req.body, req.user!);
      res.status(201).json({ success: true, message: 'Group created', data: group });
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
      const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT));
      const result = await groupService.list(req.user!._id.toString(), req.user!.role, page, limit);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupService.getById(req.params.id, req.user!._id.toString(), req.user!.role);
      res.json({ success: true, data: group });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupService.update(req.params.id, req.body, req.user!);
      res.json({ success: true, data: group });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await groupService.delete(req.params.id, req.user!);
      res.json({ success: true, message: 'Group deleted' });
    } catch (error) { next(error); }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const role = (req.body.role as GroupRole) || GroupRole.MEMBER;
      const member = await groupService.addMember(req.params.id, req.body.userId, role, req.user!);
      res.status(201).json({ success: true, data: member });
    } catch (error) { next(error); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await groupService.removeMember(req.params.id, req.params.uid, req.user!);
      res.json({ success: true, message: 'Member removed' });
    } catch (error) { next(error); }
  }
}

export const groupController = new GroupController();
