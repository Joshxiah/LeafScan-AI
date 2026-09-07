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

  /**
   * A stable, machine-readable identifier for this failure (e.g.
   * "INVALID_CREDENTIALS", "TOKEN_EXPIRED"), separate from the
   * human-readable `message`.
   *
   * `message` is English prose meant to be read directly - it is
   * never translated for a Cebuano-speaking farmer. `code` gives
   * a client something stable to switch on so it CAN show a
   * localized string for the failures worth localizing, falling
   * back to `message` for anything without a mapped translation.
   */
  public readonly code?: string;

  constructor(statusCode: number, message: string, code?: string, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restores the correct prototype chain when extending a
    // built-in class in TypeScript. Without this, checks using
    // "instanceof ApiError" can fail.
    Object.setPrototypeOf(this, ApiError.prototype);

    Error.captureStackTrace(this, this.constructor);
  }

  // ---------- Shortcuts for the errors we use most ----------

  /** 400 - the client sent something invalid (empty field, bad format) */
  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code);
  }

  /** 401 - no valid login token was provided */
  static unauthorized(message = 'Authentication required', code?: string): ApiError {
    return new ApiError(401, message, code);
  }

  /** 403 - logged in, but not allowed to do this (farmer hitting a CAO route) */
  static forbidden(
    message = 'You do not have permission to perform this action',
    code?: string
  ): ApiError {
    return new ApiError(403, message, code);
  }

  /** 404 - the requested thing does not exist */
  static notFound(message = 'Resource not found', code?: string): ApiError {
    return new ApiError(404, message, code);
  }

  /** 409 - conflicts with existing data (email already registered) */
  static conflict(message: string, code?: string): ApiError {
    return new ApiError(409, message, code);
  }

  /** 413 - the uploaded image is too large */
  static payloadTooLarge(message = 'Uploaded file is too large', code?: string): ApiError {
    return new ApiError(413, message, code);
  }

  /** 500 - something broke on our side */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }

  /** 503 - a dependency is down (database or AI service unreachable) */
  static serviceUnavailable(message = 'Service temporarily unavailable', code?: string): ApiError {
    return new ApiError(503, message, code);
  }
}