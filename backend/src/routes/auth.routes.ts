/**
 * Authentication routes for LeafScan AI.
 *
 * Mounted at /api/auth in app.ts, so the paths below become:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *   GET  /api/auth/me
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * PUBLIC - a farmer cannot have a token before they have an account.
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * PUBLIC - logging in is how a token is obtained.
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/forgot-password
 * PUBLIC - a locked-out user has no token. Sends a reset code by email.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * PUBLIC - the emailed code is the credential here.
 */
router.post('/reset-password', authController.resetPassword);

/**
 * GET /api/auth/me
 * PROTECTED - authenticate runs first and rejects the request
 * with 401 if no valid token is present.
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router;