/**
 * A custom error that carries an HTTP status code.
 *
 * Ordinary JavaScript errors only have a message. When something
 * goes wrong in a service, we need to tell the client WHICH kind
 * of failure it was: 400 (your request was wrong), 401 (log in
 * first), 404 (not found), 500 (our fault).
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Restores the correct prototype chain when extending a
    // built-in class in TypeScript. Without this, checks using
    // "instanceof ApiError" can fail.
    Object.setPrototypeOf(this, ApiError.prototype);

    Error.captureStackTrace(this, this.constructor);
  }

  // ---------- Shortcuts for the errors we use most ----------

  /** 400 - the client sent something invalid (empty field, bad format) */
  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  /** 401 - no valid login token was provided */
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  /** 403 - logged in, but not allowed to do this (farmer hitting a CAO route) */
  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  /** 404 - the requested thing does not exist */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /** 409 - conflicts with existing data (email already registered) */
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  /** 413 - the uploaded image is too large */
  static payloadTooLarge(message = 'Uploaded file is too large'): ApiError {
    return new ApiError(413, message);
  }

  /** 500 - something broke on our side */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }

  /** 503 - a dependency is down (database or AI service unreachable) */
  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, message);
  }
}