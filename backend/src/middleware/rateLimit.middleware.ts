/**
 * Request throttling for the authentication endpoints.
 *
 * Login, register, and password-reset had no throttling at all -
 * a single caller could try passwords against one account forever,
 * or spam /forgot-password to burn through the SMS budget and spam
 * a farmer's phone. Each limiter below is keyed by IP address and
 * rejects with 429 once its window's cap is hit.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

function tooManyRequestsHandler(req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    message: 'Too many attempts. Please wait a while before trying again.',
    code: 'TOO_MANY_REQUESTS',
  });
}

/**
 * POST /api/auth/login
 *
 * Generous enough that a farmer who mistypes their password a few
 * times is never blocked, but a script guessing passwords is.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Local development restarts constantly; skip so the limiter
  // never gets in the way while building the app.
  skip: () => env.isDevelopment,
  handler: tooManyRequestsHandler,
});

/**
 * POST /api/auth/register
 *
 * Looser than login (a shared clinic/kiosk device may register
 * several farmers back to back) but still bounded.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: tooManyRequestsHandler,
});

/**
 * POST /api/auth/forgot-password
 *
 * Each call costs real money (one SMS) and can be aimed at any
 * farmer's number by anyone who knows it, so this is the
 * tightest limiter of the three.
 */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: tooManyRequestsHandler,
});

/**
 * POST /api/auth/reset-password
 *
 * The reset code itself already locks after 5 wrong guesses
 * (see auth.service.ts), but this stops someone from cycling
 * through many different phone numbers from one IP.
 */
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: tooManyRequestsHandler,
});

/**
 * POST /api/auth/change-password
 *
 * The caller already holds a valid token, so this is only a brake
 * on someone with a stolen token guessing the current password.
 * Same shape as the login limiter.
 */
export const changePasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: tooManyRequestsHandler,
});
