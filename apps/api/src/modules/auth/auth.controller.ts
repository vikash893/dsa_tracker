// ============================================================
// DSATracker API — Auth Controller
// Thin controller: delegates all logic to AuthService.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import { parseExpiryToMs } from '../../utils/jwt.js';

/** Cookie options for refresh token */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRY),
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          accessToken,
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
        ip,
        userAgent,
      );

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            role: user.role,
            avatar: user.avatar,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Accept from cookie or body
      const token =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const { accessToken, refreshToken } =
        await authService.refreshAccessToken(token);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (req.user) {
        await authService.logout(req.user._id.toString(), refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);

      res.json({
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      await authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!._id.toString());

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
