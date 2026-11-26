import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { BARANGAYS } from './barangays';
import { listBarangaysForCity } from '../services/address.service';

// PSGC municipality code for Pagadian City, Zamboanga del Sur.
const PAGADIAN_CITY_CODE = '097322';

describe('fixed barangay list', () => {
  it('has all 54 barangays of Pagadian City', () => {
    assert.equal(BARANGAYS.length, 54);
  });

  it('has no duplicates and no stray whitespace', () => {
    assert.equal(new Set(BARANGAYS).size, BARANGAYS.length);
    for (const name of BARANGAYS) assert.equal(name, name.trim());
  });

  it('is in alphabetical order', () => {
    const sorted = [...BARANGAYS].sort((a, b) => a.localeCompare(b));
    assert.deepEqual([...BARANGAYS], sorted);
  });

  it('covers every barangay in the bundled PSGC dataset (minus the "(Pob.)" suffix)', () => {
    // The dataset predates Santo Niño, so it lists 53 - everything in
    // it must still be in ours.
    const psgc = listBarangaysForCity(PAGADIAN_CITY_CODE).map((name) =>
      name.replace(/\s*\(Pob\.\)\s*$/, '')
    );
    assert.ok(psgc.length >= 53);
    const ours = new Set<string>(BARANGAYS);
    const missing = psgc.filter((name) => !ours.has(name));
    assert.deepEqual(missing, []);
  });
});
