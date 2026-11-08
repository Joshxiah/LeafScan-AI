/**
 * Tests for the stale-AI-service check. The incident it guards against:
 * the 5-class model was saved to disk while the Python service was still
 * running the old 4-class one, so non-corn photos were scored as diseases
 * and saved.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { describeLabelMismatch } from './labelMismatch';

const FIVE = ['southern_rust', 'gray_leaf_spot', 'healthy', 'northern_leaf_blight', 'not_corn'];
const FOUR = ['southern_rust', 'gray_leaf_spot', 'healthy', 'northern_leaf_blight'];

describe('describeLabelMismatch', () => {
  test('same classes: no problem', () => {
    assert.equal(describeLabelMismatch(FIVE, FIVE), null);
  });

  test('order does not matter', () => {
    assert.equal(describeLabelMismatch([...FIVE].reverse(), FIVE), null);
  });

  test('old 4-class service against a 5-class labels.json: names the missing class', () => {
    const problem = describeLabelMismatch(FOUR, FIVE);
    assert.ok(problem);
    assert.match(problem, /no score for not_corn/);
  });

  test('new 5-class service against an old 4-class labels.json: names the extra class', () => {
    const problem = describeLabelMismatch(FIVE, FOUR);
    assert.ok(problem);
    assert.match(problem, /scored not_corn/);
  });

  test('a renamed class shows up on both sides', () => {
    const problem = describeLabelMismatch(['healthy', 'rust'], ['healthy', 'southern_rust']);
    assert.ok(problem);
    assert.match(problem, /no score for southern_rust/);
    assert.match(problem, /scored rust/);
  });
});
