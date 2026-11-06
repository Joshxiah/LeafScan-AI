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

/**
 * POST /api/auth/admin/forgot-password
 * Step 1 of a password reset: emails a 6-digit code to the CAO account
 * that owns this address. Resolves the same way whether or not the
 * address is registered, so the page cannot be used to probe accounts.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post<void>('/auth/admin/forgot-password', { email }, false);
}

/**
 * POST /api/auth/admin/verify-reset-code
 * Step 2: checks the emailed code without using it up, so the page can
 * ask for the new password. The same code is sent again, with the new
 * password, to resetPassword().
 */
export async function verifyResetCode(email: string, code: string): Promise<void> {
  await api.post<void>('/auth/admin/verify-reset-code', { email, code }, false);
}

/**
 * POST /api/auth/admin/reset-password
 * Step 3: checks the emailed code and sets the new password.
 */
export async function resetPassword(
  email: string,
  code: string,
  password: string
): Promise<void> {
  await api.post<void>('/auth/admin/reset-password', { email, code, password }, false);
}

export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  /** The address the password-reset code is emailed to. Needs `currentPassword`. */
  email?: string;
  /** Required by the backend whenever `email` is being changed. */
  currentPassword?: string;
  /** From uploadImage() in upload.service.ts, or '' to remove the photo. */
  avatarPath?: string;
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
