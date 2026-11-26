import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createAgriculturistSchema, updateAgriculturistSchema } from './validation';

describe('agriculturist service area (barangays)', () => {
  it('accepts several barangays from the fixed list on create', () => {
    const parsed = createAgriculturistSchema.parse({
      fullName: 'Joselito Ubaub',
      barangays: ['Danlugan', 'Dao', 'Datagan'],
    });
    assert.deepEqual(parsed.barangays, ['Danlugan', 'Dao', 'Datagan']);
  });

  it('treats barangays as optional on create', () => {
    const parsed = createAgriculturistSchema.parse({ fullName: 'Joselito Ubaub' });
    assert.equal(parsed.barangays, undefined);
  });

  it('accepts an empty list on update (clears the service area)', () => {
    const parsed = updateAgriculturistSchema.parse({ barangays: [] });
    assert.deepEqual(parsed.barangays, []);
  });

  it('leaves barangays undefined on update when it is not sent', () => {
    const parsed = updateAgriculturistSchema.parse({ fullName: 'Joselito Ubaub' });
    assert.equal(parsed.barangays, undefined);
  });

  it('rejects a barangay that is not in the fixed list', () => {
    assert.throws(() =>
      updateAgriculturistSchema.parse({ barangays: ['Danlugan', 'Not A Barangay'] })
    );
  });

  it('rejects a single string where a list is expected', () => {
    assert.throws(() => updateAgriculturistSchema.parse({ barangays: 'Danlugan' }));
  });
});
