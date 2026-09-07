/**
 * Authentication routes for LeafScan AI.
 *
 * Mounted at /api/auth in app.ts, so the paths below become:
 *   POST  /api/auth/register
 *   POST  /api/auth/login
 *   POST  /api/auth/forgot-password
 *   POST  /api/auth/reset-password
 *   GET   /api/auth/me
 *   PATCH /api/auth/me
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
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
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * PUBLIC - the texted code is the credential here.
 */
router.post('/reset-password', resetPasswordRateLimiter, authController.resetPassword);

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
router.patch('/me', authenticate, authController.updateProfile);

export default router;