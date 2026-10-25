import { Color } from 'three';
import { describe, expect, test } from 'vitest';
import { SEASONS, palette } from '../../src/scenes/valley/palette';
import { ZONES } from '../../src/scenes/valley/zones';

const hsl = (hex: string) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 });

describe('valley palette', () => {
  test('the giant sequoia is evergreen: its crown never changes with the season', () => {
    const crowns = new Set(SEASONS.map((s) => palette(s, false).sequoiaCrown));
    expect(crowns.size).toBe(1);
  });

  test('Pacific dogwood carries the seasons: white in spring, red in autumn', () => {
    expect(hsl(palette('spring', false).dogwood).l).toBeGreaterThan(0.85);
    const autumn = new Color(palette('autumn', false).dogwood);
    expect(autumn.r).toBeGreaterThan(autumn.g * 1.8);
  });

  test('night skies are darker than day skies in every season', () => {
    for (const s of SEASONS) expect(hsl(palette(s, true).sky).l).toBeLessThan(hsl(palette(s, false).sky).l);
  });

  test('every season defines every colour', () => {
    const keys = Object.keys(palette('spring', false)).sort();
    for (const s of SEASONS) for (const n of [false, true]) expect(Object.keys(palette(s, n)).sort()).toEqual(keys);
  });
});

describe('valley zones', () => {
  test('ids are unique and labels exist in both languages', () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
    for (const z of ZONES) {
      expect(z.label.en.length).toBeGreaterThan(0);
      expect(z.label.zh.length).toBeGreaterThan(0);
    }
  });

  test('the tree view looks up into the trunk, not at the ground', () => {
    expect(ZONES.find((z) => z.id === 'tree')!.view.target[1]).toBeGreaterThan(0);
  });
});
