/**
 * HTTP handlers for authentication.
 *
 * Controllers deal only with the request and the response. They
 * read input, call a service, and shape the reply. All rules and
 * SQL live in auth.service.ts.
 */

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { ApiError } from '../utils/ApiError';

/**
 * POST /api/auth/register
 * Creates a farmer account. Used by the Create Account screen.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const input = validate(registerSchema, req.body);

  const result = await authService.registerFarmer(input);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: result,
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