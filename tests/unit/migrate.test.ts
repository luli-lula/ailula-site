import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { classifyKind, hugoUrlize, migratePost, migrateProject } from '../../scripts/migrate-lib';

const OLD = '/Users/lu/Documents/Side-Projects/luli-lula.github.io';
const sitemap = (f: string) =>
  [...readFileSync(join(OLD, f), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
    decodeURIComponent(m[1]).replace('http://localhost:1313', ''),
  );
const oldUrls = new Set([...sitemap('public/zh/sitemap.xml'), ...sitemap('public/en/sitemap.xml')]);

describe('hugoUrlize', () => {
  test('matches Hugo for spaces, dashes, symbols and emoji', () => {
    expect(hugoUrlize('034-Week34 - Mushroom Day')).toBe('034-week34---mushroom-day');
    expect(hugoUrlize('018-《Waking life》 &《Richard Linklater: Dream Is Destiny》')).toBe('018-waking-life-richard-linklater-dream-is-destiny');
    expect(hugoUrlize('024-📖扔掉书本上街去—希望病')).toBe('024-扔掉书本上街去希望病');
  });
});

describe('migratePost', () => {
  test('TOML frontmatter post keeps its legacy path', () => {
    const name = '029-好的产品遍地都是.zh.md';
    const raw = readFileSync(join(OLD, 'content/posts', name), 'utf8');
    const p = migratePost({ name, raw });
    expect(p.slug).toBe('029-好的产品遍地都是');
    expect(p.lang).toBe('zh');
    expect(p.frontmatter.title).toBe('好的产品遍地都是');
    expect(p.frontmatter.legacyPaths).toContain('/zh/posts/029-好的产品遍地都是/');
    expect(p.body).toContain('Good Suduku');
  });

  test('every old post maps to a URL in the old sitemaps', () => {
    for (const name of readdirSync(join(OLD, 'content/posts')).filter((n) => n.endsWith('.md'))) {
      const p = migratePost({ name, raw: readFileSync(join(OLD, 'content/posts', name), 'utf8') });
      const zhOrEn = p.frontmatter.legacyPaths.filter((x) => oldUrls.has(x));
      expect(zhOrEn, name).not.toHaveLength(0);
    }
  });
});

describe('migrateProject', () => {
  test('keeps links from frontmatter', () => {
    const name = 'celpip12.zh.md';
    const p = migrateProject({ name, raw: readFileSync(join(OLD, 'content/projects', name), 'utf8') });
    expect(p.slug).toBe('celpip12');
    expect(p.frontmatter.legacyPaths).toContain('/zh/projects/celpip12/');
    expect(p.frontmatter.links).toContainEqual({ label: 'Demo', url: 'https://celpip12.vercel.app/' });
  });
});

describe('classifyKind', () => {
  test('sorts posts into forest-floor kinds', () => {
    expect(classifyKind('📖一间只属于自己的房间', [], new Date('2020-05-09'))).toBe('notes');
    expect(classifyKind('《婚姻生活》', [], new Date('2020-01-30'))).toBe('notes');
    expect(classifyKind('Week33 - 拿到驾照&MGV项目面试通过', [], new Date('2025-08-18'))).toBe('weekly');
    expect(classifyKind('SQL必知必会笔记', [], new Date('2017-05-28'))).toBe('old-notes');
    expect(classifyKind('好的产品遍地都是', [], new Date('2025-03-19'))).toBe('essay');
  });
});
