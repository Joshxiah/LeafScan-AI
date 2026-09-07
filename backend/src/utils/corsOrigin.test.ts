/**
 * Tests for the CORS origin check - this replaced `origin: '*'`,
 * so it is worth confirming both halves actually hold: production
 * allows only the configured list, and development trusts any
 * origin (it is never reachable off this machine anyway).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { isAllowedOrigin } from './corsOrigin';

describe('isAllowedOrigin', () => {
  test('production: allows an exact match from ALLOWED_ORIGINS', () => {
    assert.ok(
      isAllowedOrigin('https://admin.leafscan.example', ['https://admin.leafscan.example'], false)
    );
  });

  test('production: rejects anything not on the list', () => {
    assert.ok(!isAllowedOrigin('http://192.168.1.9:8081', [], false));
    assert.ok(!isAllowedOrigin('https://evil.example', ['https://admin.leafscan.example'], false));
  });

  test('development: allows any origin, including a Vite dev server bumped to a new port', () => {
    assert.ok(isAllowedOrigin('http://localhost:5173', [], true));
    assert.ok(isAllowedOrigin('http://localhost:5174', [], true));
    assert.ok(isAllowedOrigin('http://192.168.1.42:8081', [], true));
    assert.ok(isAllowedOrigin('http://192.168.1.42:9999', [], true));
  });
});
