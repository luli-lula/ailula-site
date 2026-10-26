import { describe, expect, test } from 'vitest';
// @ts-expect-error plain ESM module without types
import { normalizeFootprints } from '../../src/lib/footprints-file.mjs';

describe('saving footprints', () => {
  test('dedupes and sorts', () => {
    expect(normalizeFootprints({ countries: ['USA', 'CHN', 'USA'], places: ['USA:36001', 'CHN:CN044040', 'USA:36001'] }))
      .toEqual({ countries: ['CHN', 'USA'], places: ['CHN:CN044040', 'USA:36001'] });
  });
  test('refuses anything that is not a country code or a place id', () => {
    expect(() => normalizeFootprints({ countries: ['china'], places: [] })).toThrow();
    expect(() => normalizeFootprints({ countries: [], places: ['../etc/passwd'] })).toThrow();
    expect(() => normalizeFootprints({ countries: 'CHN', places: [] })).toThrow();
    expect(() => normalizeFootprints(null)).toThrow();
  });
});
