/**
 * Tests for the CAO email password-reset inputs. The address is the
 * lookup key for the reset, so it has to be normalised the same way
 * everywhere (trimmed, lowercased) or "Admin@Gmail.com" would miss the
 * account stored as "admin@gmail.com".
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validate,
  adminForgotPasswordSchema,
  adminVerifyResetCodeSchema,
  adminResetPasswordSchema,
  updateProfileSchema,
} from './validation';
import { ApiError } from './ApiError';

describe('adminForgotPasswordSchema', () => {
  test('trims and lowercases the email', () => {
    const { email } = validate(adminForgotPasswordSchema, { email: '  CAO.Admin@Gmail.COM ' });
    assert.equal(email, 'cao.admin@gmail.com');
  });

  test('rejects something that is not an email', () => {
    assert.throws(() => validate(adminForgotPasswordSchema, { email: 'admins' }), ApiError);
    assert.throws(() => validate(adminForgotPasswordSchema, {}), ApiError);
  });
});

describe('adminVerifyResetCodeSchema', () => {
  test('trims and lowercases the email, keeping leading zeros in the code', () => {
    const input = validate(adminVerifyResetCodeSchema, { email: ' CAO@Gmail.com ', code: ' 012345 ' });
    assert.equal(input.email, 'cao@gmail.com');
    assert.equal(input.code, '012345');
  });

  test('rejects a code that is not exactly 6 digits, or a missing email', () => {
    for (const code of ['12345', '1234567', 'abcdef', '12 345']) {
      assert.throws(() => validate(adminVerifyResetCodeSchema, { email: 'cao@gmail.com', code }), ApiError);
    }
    assert.throws(() => validate(adminVerifyResetCodeSchema, { code: '012345' }), ApiError);
  });
});

describe('adminResetPasswordSchema', () => {
  const valid = { email: 'cao@gmail.com', code: '012345', password: 'LeafScan@2026' };

  test('accepts a 6-digit code, keeping leading zeros', () => {
    assert.equal(validate(adminResetPasswordSchema, valid).code, '012345');
  });

  test('rejects a code that is not exactly 6 digits', () => {
    for (const code of ['12345', '1234567', 'abcdef', '12 345']) {
      assert.throws(() => validate(adminResetPasswordSchema, { ...valid, code }), ApiError);
    }
  });

  test('rejects a password shorter than 8 characters', () => {
    assert.throws(() => validate(adminResetPasswordSchema, { ...valid, password: 'short' }), ApiError);
  });
});

describe('updateProfileSchema email change', () => {
  test('normalises the email and carries the current password along', () => {
    const input = validate(updateProfileSchema, {
      email: 'New.Address@Gmail.com',
      currentPassword: 'LeafScan@2026',
    });
    assert.equal(input.email, 'new.address@gmail.com');
    assert.equal(input.currentPassword, 'LeafScan@2026');
  });

  test('an update that leaves the email out is still valid', () => {
    assert.equal(validate(updateProfileSchema, { fullName: 'CAO Admin' }).email, undefined);
  });

  test('rejects a malformed email', () => {
    assert.throws(() => validate(updateProfileSchema, { email: 'not-an-email' }), ApiError);
  });
});
