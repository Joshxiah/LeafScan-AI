/**
 * Tests for password hashing - the layer standing between a
 * database leak and every farmer's plaintext password.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword } from './password';

describe('hashPassword / verifyPassword', () => {
  test('a hash verifies against the password it was made from', async () => {
    const hash = await hashPassword('correct horse battery staple');

    assert.ok(await verifyPassword('correct horse battery staple', hash));
  });

  test('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    assert.ok(!(await verifyPassword('wrong password', hash)));
  });

  test('never stores the plaintext password in the hash', async () => {
    const plaintext = 'correct horse battery staple';
    const hash = await hashPassword(plaintext);

    assert.ok(!hash.includes(plaintext));
  });

  test('the same password hashes differently each time (unique salt)', async () => {
    const [first, second] = await Promise.all([
      hashPassword('same password'),
      hashPassword('same password'),
    ]);

    assert.notEqual(first, second);
  });
});
