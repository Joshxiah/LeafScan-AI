/**
 * Authentication calls to the backend.
 *
 * A thin layer naming each endpoint, so screens never contain
 * URL strings. If an endpoint path changes, it changes here only.
 */

import { api } from './api';
import { AuthResult, User, LoginPayload, RegisterPayload } from '../types';

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