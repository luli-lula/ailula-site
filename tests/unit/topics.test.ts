import { existsSync, readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { describe, expect, test } from 'vitest';
import { TOPICS } from '../../src/lib/topics';

const DIR = 'src/content/posts';
const posts = readdirSync(DIR).map((slug) => ({ slug, zh: matter(readFileSync(`${DIR}/${slug}/zh.md`, 'utf8')).data, hasEn: existsSync(`${DIR}/${slug}/en.md`) }));

describe('writing topics', () => {
  test('every post has one or two topics from the fixed list', () => {
    for (const p of posts) {
      expect(p.zh.topics, p.slug).toBeInstanceOf(Array);
      expect(p.zh.topics.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(p.zh.topics.length, p.slug).toBeLessThanOrEqual(2);
      for (const t of p.zh.topics) expect(TOPICS, `${p.slug}: ${t}`).toContain(t);
    }
  });
  test('posts without an English version still have an English title for the English list', () => {
    for (const p of posts.filter((x) => !x.hasEn)) expect(typeof p.zh.titleEn, p.slug).toBe('string');
  });
});
