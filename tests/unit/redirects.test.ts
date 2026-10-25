import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { EXTRA_REDIRECTS, buildRedirects } from '../../scripts/redirects-lib';
import redirects from '../../src/redirects.json';

const OLD = '/Users/lu/Documents/Side-Projects/luli-lula.github.io';
const locs = (f: string) =>
  [...readFileSync(join(OLD, f), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
    decodeURIComponent(m[1]).replace('http://localhost:1313', ''),
  );

describe('buildRedirects', () => {
  test('maps legacy post paths to the new writing route', () => {
    const r = buildRedirects([{ legacyPaths: ['/zh/posts/029-好的产品遍地都是/'], newPath: '/zh/writing/029-好的产品遍地都是/' }], {});
    expect(r['/zh/posts/029-好的产品遍地都是/']).toBe('/zh/writing/029-好的产品遍地都是/');
  });

  test('never redirects a path to itself', () => {
    const r = buildRedirects([{ legacyPaths: ['/projects/celpip12/'], newPath: '/projects/celpip12/' }], {});
    expect(r).toEqual({});
  });

  test('section pages have new homes in both languages', () => {
    expect(EXTRA_REDIRECTS['/posts/']).toBe('/writing/');
    expect(EXTRA_REDIRECTS['/zh/posts/']).toBe('/zh/writing/');
    expect(EXTRA_REDIRECTS['/archives/']).toBe('/writing/');
    expect(EXTRA_REDIRECTS['/movies/']).toBe('/cinema/');
    expect(EXTRA_REDIRECTS['/zh/books/']).toBe('/zh/cinema/');
    expect(EXTRA_REDIRECTS['/tags/']).toBe('/writing/');
    expect(EXTRA_REDIRECTS['/zh/about/']).toBe('/zh/');
  });
});

describe('generated redirects', () => {
  const routes = new Set(['/', '/zh/', '/projects/', '/zh/projects/', '/projects/celpip12/', '/projects/adhd-focus/', '/zh/projects/celpip12/', '/zh/projects/adhd-focus/']);
  test('every URL in the old sitemaps still leads somewhere', () => {
    for (const loc of [...locs('public/zh/sitemap.xml'), ...locs('public/en/sitemap.xml')]) {
      if (loc.endsWith('sitemap.xml')) continue;
      expect(routes.has(loc) || loc in redirects, loc).toBe(true);
    }
  });
});
