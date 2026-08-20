// ============================================================
// DSATracker API — Password Utilities
// bcrypt hashing and comparison.
// ============================================================

import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../config/constants.js';

/**
 * Hash a plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
