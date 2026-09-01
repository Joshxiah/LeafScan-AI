/**
 * JWT creation and verification for LeafScan AI.
 *
 * A token proves "this request comes from user X, who has role Y"
 * without the server storing any session data.
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';
import { ApiError } from './ApiError';

/**
 * What we put inside a token.
 *
 * IMPORTANT: a JWT payload is ENCODED, NOT ENCRYPTED. Anyone can
 * decode and read it. Never place a password, a hash, or any
 * private information here.
 */
export interface TokenPayload {
  userId: number;
  role: UserRole;
}

/**
 * Creates a signed token for a user.
 *
 * The signature is derived from the payload plus JWT_SECRET, so
 * a payload edited by an attacker will fail verification.
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    issuer: 'leafscan-ai',
  };

  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Verifies a token and returns its contents.
 *
 * Throws a clear ApiError for the two failure cases a user can
 * actually act on: an expired token (log in again) and an invalid
 * one (something is wrong with the token itself).
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.secret, {
      issuer: 'leafscan-ai',
    });

    if (typeof decoded === 'string') {
      throw ApiError.unauthorized('Invalid token format');
    }

    const payload = decoded as jwt.JwtPayload & Partial<TokenPayload>;

    if (typeof payload.userId !== 'number' || typeof payload.role !== 'string') {
      throw ApiError.unauthorized('Token payload is malformed');
    }

    return {
      userId: payload.userId,
      role: payload.role as UserRole,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid authentication token');
    }

    throw ApiError.unauthorized('Could not verify authentication token');
  }
}

/**
 * Pulls the token out of an Authorization header.
 *
 * The expected format is:  Authorization: Bearer <token>
 *
 * "Bearer" is the standard scheme name meaning "whoever bears
 * this token is granted access".
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw ApiError.unauthorized('No authentication token provided');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw ApiError.unauthorized('Authorization header must be in the format: Bearer <token>');
  }

  return parts[1];
}