/**
 * Central error handling for LeafScan AI.
 *
 * Every error thrown anywhere in the application ends up here,
 * so responses have one consistent shape and internal details
 * are never leaked to clients.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/**
 * Runs when no route matched the requested URL.
 * Must be registered AFTER all real routes.
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * The final error handler.
 *
 * Express identifies this as an error handler because it has
 * FOUR parameters starting with "err". Remove the unused "next"
 * parameter and Express will silently treat it as a normal
 * middleware and your error handling will stop working.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof SyntaxError && 'body' in err) {
    // Thrown by express.json() when the request body is malformed JSON
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (isDatabaseConnectionError(err)) {
    statusCode = 503;
    message = 'Database is unavailable. Please try again shortly.';
  }

  // Always log the full error on the server, where only you can see it.
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${statusCode}`);
  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
    // Stack traces are helpful to you but must NEVER reach a
    // production client, so they appear in development only.
    ...(env.isDevelopment ? { stack: err.stack } : {}),
  });
}

/**
 * Recognises the codes mysql2 reports when MySQL is not running.
 * This is what turns "XAMPP is off" into a clear 503 message
 * rather than a confusing 500.
 */
function isDatabaseConnectionError(err: unknown): boolean {
  const dbErrorCodes = [
    'ECONNREFUSED',
    'PROTOCOL_CONNECTION_LOST',
    'ER_CON_COUNT_ERROR',
    'ETIMEDOUT',
    'ENOTFOUND',
  ];

  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    dbErrorCodes.includes((err as { code: string }).code)
  );
}