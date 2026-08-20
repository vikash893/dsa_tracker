// ============================================================
// DSATracker API — Auth Service
// Business logic for authentication.
// ============================================================

import crypto from 'crypto';
import User, { IUserDoc } from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseExpiryToMs,
} from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';
import { TOKEN_CONFIG } from '../../config/constants.js';
import { AuditAction, Role } from '@dsa-tracker/types';
import type { RegisterInput, LoginInput } from './auth.validation.js';

export class AuthService {
  /**
   * Register a new user.
   */
  async register(data: RegisterInput): Promise<{
    user: IUserDoc;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check for existing user
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw AppError.conflict('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerificationToken,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateAndStoreTokens(user);

    // Audit log
    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.USER_CREATED,
      targetType: 'User',
      targetId: user._id,
      metadata: { email: user.email, role: user.role },
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email and password.
   */
  async login(
    data: LoginInput,
    ip?: string,
    userAgent?: string,
  ): Promise<{
    user: IUserDoc;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user with password field
    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated. Contact your administrator.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateAndStoreTokens(user);

    // Audit log
    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.LOGIN,
      targetType: 'User',
      targetId: user._id,
      ip,
      userAgent,
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify the refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find user and verify the refresh token exists in their stored tokens
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated');
    }

    const storedToken = user.refreshTokens.find((rt) => rt.token === refreshToken);
    if (!storedToken) {
      // Token reuse detected — possible theft. Invalidate all tokens.
      user.refreshTokens = [];
      await user.save();
      throw AppError.unauthorized('Refresh token has been revoked. All sessions terminated.');
    }

    // Remove the used refresh token (rotation)
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);

    // Generate new token pair
    const tokens = await this.generateAndStoreTokens(user);
    return tokens;
  }

  /**
   * Logout: remove the specific refresh token.
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    if (refreshToken) {
      // Remove only the specific token
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
    } else {
      // Logout from all devices
      user.refreshTokens = [];
    }

    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.LOGOUT,
      targetType: 'User',
      targetId: user._id,
    });
  }

  /**
   * Initiate forgot password flow.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email }).select(
      '+passwordResetToken +passwordResetExpires',
    );

    // Always return success (don't leak whether email exists)
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(
      Date.now() + TOKEN_CONFIG.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    await user.save();

    // TODO: Send email with reset link containing `resetToken`
    // For now, log it in development
    if (env.NODE_ENV === 'development') {
      console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
    }
  }

  /**
   * Reset password using token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

    if (!user) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all sessions after password change
    user.refreshTokens = [];
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.PASSWORD_RESET,
      targetType: 'User',
      targetId: user._id,
    });
  }

  /**
   * Verify email using token.
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ emailVerificationToken: token }).select(
      '+emailVerificationToken',
    );

    if (!user) {
      throw AppError.badRequest('Invalid verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  /**
   * Get current user profile.
   */
  async getMe(userId: string): Promise<IUserDoc> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  // -----------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------

  /**
   * Generate access + refresh tokens and store refresh token in user doc.
   */
  private async generateAndStoreTokens(user: IUserDoc): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const jwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    // Store refresh token
    const expiresAt = new Date(
      Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRY),
    );

    // Load refreshTokens if not already selected
    if (!user.refreshTokens) {
      const loaded = await User.findById(user._id).select('+refreshTokens');
      if (loaded) {
        user.refreshTokens = loaded.refreshTokens;
      }
    }

    // Clean expired tokens
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > now);

    // Cap active sessions at 5
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }

    user.refreshTokens.push({
      token: refreshToken,
      createdAt: now,
      expiresAt,
    });

    await user.save();

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
