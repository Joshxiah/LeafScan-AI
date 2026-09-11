/**
 * Authentication calls for the CAO admin platform.
 */

import { api } from './api';
import type { AuthResult, User } from '../types';

/**
 * POST /api/auth/login
 *
 * The same endpoint farmers use. CAO staff and farmers both sign
 * in with a username; the role on the returned user determines
 * whether they are allowed into the admin platform.
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', { username, password }, false);
}

/**
 * GET /api/auth/me
 * Confirms a saved token is still valid and returns fresh details.
 */
export async function getCurrentUser(): Promise<User> {
  const result = await api.get<{ user: User }>('/auth/me');
  return result.user;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string;
}

/**
 * PATCH /api/auth/me
 * Edits the signed-in CAO admin's own name / phone.
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const result = await api.patch<{ user: User }>('/auth/me', payload);
  return result.user;
}

/**
 * POST /api/auth/change-password
 * The signed-in admin sets a new password, proving they know the
 * current one. The existing token stays valid afterwards.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post<void>('/auth/change-password', { currentPassword, newPassword });
}
