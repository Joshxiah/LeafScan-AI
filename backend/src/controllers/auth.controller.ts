/**
 * HTTP handlers for authentication.
 *
 * Controllers deal only with the request and the response. They
 * read input, call a service, and shape the reply. All rules and
 * SQL live in auth.service.ts.
 */

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
  validate,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminForgotPasswordSchema,
  adminVerifyResetCodeSchema,
  adminResetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validation';
import { ApiError } from '../utils/ApiError';

/**
 * POST /api/auth/register
 *
 * DISABLED. Farmer accounts are issued by the City Agriculture
 * Office (admin platform -> Farmers -> Add Farmer), not by farmers
 * themselves. The route stays mounted so older app builds get a
 * clear message instead of a network error.
 */
export async function register(_req: Request, res: Response): Promise<void> {
  res.status(403).json({
    success: false,
    code: 'REGISTRATION_DISABLED',
    message:
      'Farmer accounts are created by the City Agriculture Office. Please ask the CAO for your login details.',
  });
}

/**
 * POST /api/auth/login
 * Logs in a farmer or a CAO admin. Used by both Login screens.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const input = validate(loginSchema, req.body);

  const result = await authService.login(input);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
}

/**
 * POST /api/auth/forgot-password
 * Step 1 of a reset. Texts a 6-digit code to the number if it
 * belongs to an active account. Always returns 200 with the same
 * message, so it cannot be used to probe which numbers are registered.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = validate(forgotPasswordSchema, req.body);

  await authService.requestPasswordReset(input.phoneNumber);

  res.status(200).json({
    success: true,
    message: authService.RESET_REQUEST_MESSAGE,
  });
}

/**
 * POST /api/auth/reset-password
 * Step 2 of a reset. Checks the code and sets the new password.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = validate(resetPasswordSchema, req.body);

  await authService.resetPassword(input.phoneNumber, input.code, input.password);

  res.status(200).json({
    success: true,
    message: 'Your password has been updated. You can now sign in.',
  });
}

/**
 * POST /api/auth/admin/forgot-password
 * Step 1 of a CAO reset. Emails a 6-digit code to the address if it
 * belongs to an active admin account. Always returns 200 with the
 * same message, so it cannot be used to probe which emails exist.
 */
export async function adminForgotPassword(req: Request, res: Response): Promise<void> {
  const input = validate(adminForgotPasswordSchema, req.body);

  await authService.requestAdminPasswordReset(input.email);

  res.status(200).json({
    success: true,
    message: authService.ADMIN_RESET_REQUEST_MESSAGE,
  });
}

/**
 * POST /api/auth/admin/verify-reset-code
 * Step 2 of a CAO reset. Confirms the emailed code is right without
 * using it up; the code is sent again with the new password in step 3.
 */
export async function adminVerifyResetCode(req: Request, res: Response): Promise<void> {
  const input = validate(adminVerifyResetCodeSchema, req.body);

  await authService.verifyAdminResetCode(input.email, input.code);

  res.status(200).json({
    success: true,
    message: 'Code verified. Choose a new password.',
  });
}

/**
 * POST /api/auth/admin/reset-password
 * Step 3 of a CAO reset. Checks the emailed code and sets the new password.
 */
export async function adminResetPassword(req: Request, res: Response): Promise<void> {
  const input = validate(adminResetPasswordSchema, req.body);

  await authService.resetAdminPassword(input.email, input.code, input.password);

  res.status(200).json({
    success: true,
    message: 'Your password has been updated. You can now sign in.',
  });
}

/**
 * GET /api/auth/me
 * Returns the logged-in user. Used by the Profile screen and to
 * restore a session when the app reopens.
 *
 * Protected by the authenticate middleware, so req.user is set.
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const user = await authService.getUserById(req.user.userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

/**
 * PATCH /api/auth/me
 * Edits the signed-in user's own profile. Used by the Settings screen.
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(updateProfileSchema, req.body);
  const user = await authService.updateProfile(req.user.userId, req.user.role, input);

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: { user },
  });
}

/**
 * POST /api/auth/change-password
 * The signed-in user sets a new password, proving they know the
 * current one. Used by the admin Profile page and mobile Settings.
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const input = validate(changePasswordSchema, req.body);
  await authService.changePassword(req.user.userId, input);

  res.status(200).json({
    success: true,
    message: 'Your password has been changed.',
  });
}