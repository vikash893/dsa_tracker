// ============================================================
// DSATracker API — Auth Routes
// ============================================================

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const router = Router();

// Public routes (with auth rate limiter)
router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  (req, res, next) => authController.register(req, res, next),
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next),
);

router.post(
  '/refresh',
  authLimiter,
  (req, res, next) => authController.refresh(req, res, next),
);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  (req, res, next) => authController.forgotPassword(req, res, next),
);

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  (req, res, next) => authController.resetPassword(req, res, next),
);

router.get(
  '/verify-email',
  (req, res, next) => authController.verifyEmail(req, res, next),
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  (req, res, next) => authController.logout(req, res, next),
);

router.get(
  '/me',
  authenticate,
  (req, res, next) => authController.getMe(req, res, next),
);

export default router;
