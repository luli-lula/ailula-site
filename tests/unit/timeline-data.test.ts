import { describe, expect, test } from 'vitest';
import { timeline } from '../../src/data/timeline';

describe('timeline (from the CV)', () => {
  test('runs in order from university in 2011 to now', () => {
    expect(timeline[0].start).toBe(2011);
    for (let i = 1; i < timeline.length; i++) expect(timeline[i].start).toBeGreaterThan(timeline[i - 1].start);
    expect(timeline.at(-1)!.start).toBeGreaterThanOrEqual(2025);
  });

  test('every entry has a title and a detail in both languages', () => {
    for (const m of timeline) {
      for (const lang of ['en', 'zh'] as const) {
        expect(m.title[lang].length, `${m.start} title ${lang}`).toBeGreaterThan(0);
        expect(m.detail[lang].length, `${m.start} detail ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  test('no private contact details leak into the timeline', () => {
    const all = JSON.stringify(timeline);
    expect(all).not.toMatch(/\d{3}-\d{3}-\d{4}/);
    expect(all).not.toMatch(/@/);
  });
});
