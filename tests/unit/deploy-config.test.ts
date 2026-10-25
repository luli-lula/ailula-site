import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// The root domain also serves two GitHub Pages sub-sites (QR targets on printed plant cards, and the
// WildCard App Store privacy page). They must keep working when ailula.top moves to this site.
describe('vercel.json keeps the sub-sites under ailula.top alive', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const rewrites: { source: string; destination: string }[] = config.rewrites ?? [];
  for (const sub of ['plant-care-signs', 'wildcard-support']) {
    test(`/${sub}/ is proxied to its GitHub Pages site`, () => {
      const r = rewrites.find((x) => x.source === `/${sub}/:path*`);
      expect(r?.destination).toBe(`https://luli-lula.github.io/${sub}/:path*`);
    });
  }
  test('robots.txt still advertises the plant-care-signs sitemap', () => {
    expect(readFileSync('public/robots.txt', 'utf8')).toContain('Sitemap: https://ailula.top/plant-care-signs/sitemap.xml');
  });
});
