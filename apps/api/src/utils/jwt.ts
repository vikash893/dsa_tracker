// ============================================================
// DSATracker API — JWT Utilities
// Signs and verifies access and refresh tokens.
// ============================================================

import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@dsa-tracker/types';
import { env } from '../config/env.js';

/**
 * Sign a JWT access token (short-lived).
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Sign a JWT refresh token (long-lived).
 */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

/**
 * Verify and decode an access token.
 * Throws on invalid/expired token.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

/**
 * Verify and decode a refresh token.
 * Throws on invalid/expired token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

/**
 * Parse the expiry duration string (e.g. "7d") into milliseconds.
 * Supports: s (seconds), m (minutes), h (hours), d (days).
 */
export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown time unit: ${unit}`);
  }
}
