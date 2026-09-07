/**
 * Tests for token generation and verification.
 *
 * This is the mechanism that decided the "Invalid authentication
 * token" bug in the mobile app (a fake, non-JWT token reaching
 * verifyToken()) - worth locking down since a regression here is a
 * silent authentication bypass or a false rejection for every
 * farmer at once.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { generateToken, verifyToken, extractTokenFromHeader } from './jwt';
import { ApiError } from './ApiError';
import { env } from '../config/env';

describe('generateToken / verifyToken', () => {
  test('round-trips a payload', () => {
    const token = generateToken({ userId: 42, role: 'farmer' });
    const payload = verifyToken(token);

    assert.equal(payload.userId, 42);
    assert.equal(payload.role, 'farmer');
  });

  test('rejects a token signed with the wrong secret', () => {
    const forged = jwt.sign({ userId: 1, role: 'admin' }, 'not-the-real-secret', {
      issuer: 'leafscan-ai',
    });

    assert.throws(() => verifyToken(forged), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_INVALID');
      return true;
    });
  });

  test('rejects a garbage string - this is the exact case that broke the mobile demo-mode fallback', () => {
    assert.throws(() => verifyToken('demo-session-token'), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, 'TOKEN_INVALID');
      return true;
    });
  });

  test('rejects an expired token with TOKEN_EXPIRED', () => {
    const expired = jwt.sign({ userId: 1, role: 'farmer' }, env.jwt.secret, {
      issuer: 'leafscan-ai',
      expiresIn: -1,
    });

    assert.throws(() => verifyToken(expired), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_EXPIRED');
      return true;
    });
  });

  test('rejects a token signed for a different issuer', () => {
    const wrongIssuer = jwt.sign({ userId: 1, role: 'farmer' }, env.jwt.secret, {
      issuer: 'someone-else',
    });

    assert.throws(() => verifyToken(wrongIssuer), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_INVALID');
      return true;
    });
  });

  test('rejects a token whose payload is missing userId/role', () => {
    const incomplete = jwt.sign({ hello: 'world' }, env.jwt.secret, {
      issuer: 'leafscan-ai',
    });

    assert.throws(() => verifyToken(incomplete), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_INVALID');
      return true;
    });
  });
});

describe('extractTokenFromHeader', () => {
  test('reads the token out of a well-formed Bearer header', () => {
    assert.equal(extractTokenFromHeader('Bearer abc.def.ghi'), 'abc.def.ghi');
  });

  test('rejects a missing header with TOKEN_MISSING', () => {
    assert.throws(() => extractTokenFromHeader(undefined), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_MISSING');
      return true;
    });
  });

  test('rejects a header without the Bearer scheme', () => {
    assert.throws(() => extractTokenFromHeader('abc.def.ghi'), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'TOKEN_MISSING');
      return true;
    });
  });
});
