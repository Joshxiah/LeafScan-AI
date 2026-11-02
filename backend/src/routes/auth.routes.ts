/**
 * Authentication routes for LeafScan AI.
 *
 * Mounted at /api/auth in app.ts, so the paths below become:
 *   POST  /api/auth/register
 *   POST  /api/auth/login
 *   POST  /api/auth/forgot-password
 *   POST  /api/auth/reset-password
 *   POST  /api/auth/admin/forgot-password
 *   POST  /api/auth/admin/reset-password
 *   POST  /api/auth/change-password
 *   GET   /api/auth/me
 *   PATCH /api/auth/me
 */


import { forgotPassword, verifyResetCode, resetPassword } from '../controllers/passwordResetController';
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  changePasswordRateLimiter,
  profilePasswordCheckRateLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * PUBLIC - a farmer cannot have a token before they have an account.
 */
router.post('/register', registerRateLimiter, authController.register);

/**
 * POST /api/auth/login
 * PUBLIC - logging in is how a token is obtained.
 */
router.post('/login', loginRateLimiter, authController.login);

/**
 * POST /api/auth/forgot-password
 * PUBLIC - a locked-out user has no token. Texts a reset code by SMS.
 */
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * PUBLIC - the texted code is the credential here.
 */
router.post('/reset-password', resetPasswordRateLimiter, authController.resetPassword);

/**
 * POST /api/auth/admin/forgot-password
 * PUBLIC - a locked-out CAO admin has no token. Emails a reset code.
 */
router.post(
  '/admin/forgot-password',
  forgotPasswordRateLimiter,
  authController.adminForgotPassword
);

/**
 * POST /api/auth/admin/reset-password
 * PUBLIC - the emailed code is the credential here.
 */
router.post(
  '/admin/reset-password',
  resetPasswordRateLimiter,
  authController.adminResetPassword
);

/**
 * GET /api/auth/me
 * PROTECTED - authenticate runs first and rejects the request
 * with 401 if no valid token is present.
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * PATCH /api/auth/me
 * PROTECTED - a user editing their own profile from Settings.
 */
router.patch(
  '/me',
  profilePasswordCheckRateLimiter,
  authenticate,
  authController.updateProfile
);

/**
 * POST /api/auth/change-password
 * PROTECTED - the signed-in user sets a new password, proving they
 * know the current one. Used by both the admin platform and the app.
 */
router.post(
  '/change-password',
  changePasswordRateLimiter,
  authenticate,
  authController.changePassword
);

export default router;