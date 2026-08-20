// ============================================================
// DSATracker API — Invitation Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { invitationService } from './invitation.service.js';
import { PAGINATION } from '../../config/constants.js';

export class InvitationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const invitation = await invitationService.create(req.body, req.user!);
      res.status(201).json({ success: true, message: 'Invitation sent', data: invitation });
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
      const limit = Math.min(PAGINATION.MAX_LIMIT, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT);
      const groupId = req.query.groupId as string | undefined;
      const result = await invitationService.list(req.user!, page, limit, groupId);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const invitation = await invitationService.getByToken(req.params.token);
      res.json({ success: true, data: invitation });
    } catch (error) { next(error); }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { user } = await invitationService.accept(req.params.token, req.body);
      res.json({
        success: true,
        message: 'Invitation accepted. You can now login.',
        data: { user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } },
      });
    } catch (error) { next(error); }
  }

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      await invitationService.revoke(req.params.id, req.user!);
      res.json({ success: true, message: 'Invitation revoked' });
    } catch (error) { next(error); }
  }
}

export const invitationController = new InvitationController();
