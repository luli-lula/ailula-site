import { describe, expect, test } from 'vitest';
import { TIMELINE, heightToYear, yearToHeight } from '../../src/lib/timeline';

describe('timeline', () => {
  test('roots are 2017 and the canopy is now', () => {
    expect(TIMELINE).toEqual({ startYear: 2017, endYear: 2026, maxHeight: 115 });
    expect(yearToHeight(2017)).toBe(0);
    expect(yearToHeight(2026)).toBe(115);
  });

  test('years outside the range clamp to the tree', () => {
    expect(yearToHeight(2030)).toBe(115);
    expect(yearToHeight(2010)).toBe(0);
  });

  test('heightToYear inverts yearToHeight', () => {
    expect(heightToYear(yearToHeight(2024))).toBeCloseTo(2024);
    expect(heightToYear(yearToHeight(2019.5))).toBeCloseTo(2019.5);
  });
});
