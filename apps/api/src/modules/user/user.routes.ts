// ============================================================
// DSATracker API — User Routes
// ============================================================

import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Self-profile
router.get('/me/profile', (req, res, next) => userController.updateProfile(req, res, next));
router.patch('/me/profile', (req, res, next) => userController.updateProfile(req, res, next));

// Admin routes
router.get('/', requireAdmin, (req, res, next) => userController.listUsers(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => userController.getUser(req, res, next));
router.patch('/:id', requireAdmin, (req, res, next) => userController.updateUser(req, res, next));

// Super Admin routes
router.patch('/:id/role', requireSuperAdmin, (req, res, next) => userController.changeRole(req, res, next));
router.delete('/:id', requireSuperAdmin, (req, res, next) => userController.deactivateUser(req, res, next));

export default router;
