// ============================================================
// DSATracker API — Invitation Routes
// ============================================================

import { Router } from 'express';
import { invitationController } from './invitation.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createInvitationSchema, acceptInvitationSchema } from './invitation.validation.js';

const router = Router();

// Public routes (for accepting invitations)
router.get('/:token', (req, res, next) => invitationController.getByToken(req, res, next));
router.post('/:token/accept', validate({ body: acceptInvitationSchema }), (req, res, next) => invitationController.accept(req, res, next));

// Protected routes (admin)
router.post('/', authenticate, requireAdmin, validate({ body: createInvitationSchema }), (req, res, next) => invitationController.create(req, res, next));
router.get('/', authenticate, requireAdmin, (req, res, next) => invitationController.list(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => invitationController.revoke(req, res, next));

export default router;
