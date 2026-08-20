// ============================================================
// DSATracker — Auth Type Definitions
// ============================================================

import { Role } from './enums.js';

/** Register request body */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationToken?: string;
}

/** Login request body */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Login response payload */
export interface LoginResponse {
  accessToken: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    role: Role;
    avatar?: string;
  };
}

/** Forgot password request */
export interface ForgotPasswordRequest {
  email: string;
}

/** Reset password request */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/** JWT payload */
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

/** Token pair */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
