import { describe, expect, test } from 'vitest';
import { RING_WIDTHS, ringPath, ringRadii } from '../../src/lib/rings';

describe('rings', () => {
  test('ring path is a closed, deterministic SVG path', () => {
    expect(ringPath(50, 2, 0, 7)).toBe(ringPath(50, 2, 0, 7));
    expect(ringPath(50, 2, 0, 7)).toMatch(/^M.*Z$/);
    expect(ringPath(50, 2, 0, 7)).not.toBe(ringPath(50, 2, 0, 8));
  });

  test('big-change years get the widest rings', () => {
    expect(RING_WIDTHS[2024]).toBe(16);
    expect(RING_WIDTHS[2025]).toBe(14);
  });

  test('radii accumulate the yearly widths', () => {
    const r = ringRadii(1);
    expect(r[0]).toEqual({ year: 2017, radius: 10 });
    expect(r.at(-1)!.radius).toBe(86);
    expect(r.find((x) => x.year === 2024)!.radius - r.find((x) => x.year === 2023)!.radius).toBe(16);
    expect(ringRadii(2).at(-1)!.radius).toBe(172);
  });
});
