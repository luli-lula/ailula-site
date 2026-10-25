// Regenerates src/redirects.json from content legacyPaths and the old sitemaps.
// Run: npx tsx scripts/build-redirects.ts
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { EXTRA_REDIRECTS, buildRedirects, tagRedirects } from './redirects-lib';

const OLD = '/Users/lu/Documents/Side-Projects/luli-lula.github.io/public';
const CONTENT = new URL('../src/content/', import.meta.url).pathname;
const routeOf = { posts: 'writing', projects: 'projects' } as const;

const entries = (Object.keys(routeOf) as (keyof typeof routeOf)[]).flatMap((col) =>
  readdirSync(join(CONTENT, col)).flatMap((slug) =>
    readdirSync(join(CONTENT, col, slug)).map((file) => {
      const { data } = matter(readFileSync(join(CONTENT, col, slug, file), 'utf8'));
      const prefix = data.lang === 'zh' ? '/zh' : '';
      // Drafts are not built, so their old addresses go to the section list instead.
      const newPath = data.draft ? `${prefix}/${routeOf[col]}/` : `${prefix}/${routeOf[col]}/${slug}/`;
      return { legacyPaths: (data.legacyPaths ?? []) as string[], newPath };
    }),
  ),
);

const oldUrls = ['sitemap.xml', 'zh/sitemap.xml', 'en/sitemap.xml'].flatMap((f) => {
  try {
    return [...readFileSync(join(OLD, f), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
      decodeURIComponent(m[1]).replace(/^https?:\/\/[^/]+/, ''),
    );
  } catch {
    return [];
  }
});

const redirects = buildRedirects(entries, { ...EXTRA_REDIRECTS, ...tagRedirects(oldUrls) });
writeFileSync(new URL('../src/redirects.json', import.meta.url), JSON.stringify(redirects, null, 2) + '\n');
console.log(`${Object.keys(redirects).length} redirects`);
