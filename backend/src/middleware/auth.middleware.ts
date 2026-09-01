/**
 * Route protection for LeafScan AI.
 *
 * These functions run BEFORE a controller. They answer two
 * questions in order:
 *
 *   authenticate  -> Who are you?      (401 if unknown)
 *   requireAdmin  -> Are you allowed?  (403 if not)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

/**
 * Adds a "user" property to Express's Request type, so that
 * req.user is recognised by TypeScript throughout the project.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Requires a valid login token.
 *
 * On success, attaches the decoded payload to req.user so every
 * controller downstream knows who is making the request.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Requires the CAO admin role. Must be used AFTER authenticate.
 *
 * Usage:
 *   router.get('/farmers', authenticate, requireAdmin, listFarmers);
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }

  if (req.user.role !== 'admin') {
    next(ApiError.forbidden('This action is restricted to City Agriculture Office personnel'));
    return;
  }

  next();
}

/**
 * Requires the farmer role. Used for endpoints that only make
 * sense for a farmer, such as submitting a leaf scan.
 */
export function requireFarmer(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }

  if (req.user.role !== 'farmer') {
    next(ApiError.forbidden('This action is only available to farmer accounts'));
    return;
  }

  next();
}