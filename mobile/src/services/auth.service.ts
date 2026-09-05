/**
 * Authentication calls to the backend.
 *
 * A thin layer naming each endpoint, so screens never contain
 * URL strings. If an endpoint path changes, it changes here only.
 */

import { api } from './api';
import {
  AuthResult,
  User,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types';

/**
 * POST /api/auth/register
 * Public - no token exists yet, so requiresAuth is false.
 */
export async function register(payload: RegisterPayload): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/register', payload, false);
}

/**
 * POST /api/auth/login
 * Public - logging in is how a token is obtained.
 */
export async function login(payload: LoginPayload): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', payload, false);
}

/**
 * POST /api/auth/forgot-password
 * Public - a locked-out farmer has no token.
 *
 * Always resolves the same way whether or not the email is
 * registered, so screens must not infer anything from success.
 */
export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<void> {
  await api.post<void>('/auth/forgot-password', payload, false);
}

/**
 * POST /api/auth/reset-password
 * Public - the emailed 6-digit code is the credential.
 *
 * Throws ApiError (status 400) when the code is wrong, expired, or
 * has been tried too many times.
 */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  await api.post<void>('/auth/reset-password', payload, false);
}

/**
 * GET /api/auth/me
 * Protected - the token is attached automatically.
 *
 * Used at startup to confirm a saved token is still valid and to
 * fetch fresh user details.
 */
export async function getCurrentUser(): Promise<User> {
  const result = await api.get<{ user: User }>('/auth/me');
  return result.user;
}