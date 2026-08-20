// ============================================================
// DSATracker API — Group Routes
// ============================================================

import { Router } from 'express';
import { groupController } from './group.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createGroupSchema, updateGroupSchema, addMemberSchema } from './group.validation.js';

const router = Router();
router.use(authenticate);

router.post('/', requireAdmin, validate({ body: createGroupSchema }), (req, res, next) => groupController.create(req, res, next));
router.get('/', (req, res, next) => groupController.list(req, res, next));
router.get('/:id', (req, res, next) => groupController.getById(req, res, next));
router.patch('/:id', requireAdmin, validate({ body: updateGroupSchema }), (req, res, next) => groupController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => groupController.delete(req, res, next));
router.post('/:id/members', requireAdmin, validate({ body: addMemberSchema }), (req, res, next) => groupController.addMember(req, res, next));
router.delete('/:id/members/:uid', requireAdmin, (req, res, next) => groupController.removeMember(req, res, next));

export default router;
