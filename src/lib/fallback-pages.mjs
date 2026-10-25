// Pages that only exist in one language still get a URL in the other language (showing the original).
// Those copies are duplicates, so they stay out of the sitemap. Read straight from the content folders
// because astro.config runs before content collections exist.
import { existsSync, readdirSync } from 'node:fs';

const SECTIONS = { posts: 'writing', projects: 'projects' };

export function fallbackPaths(root = 'src/content') {
  const out = new Set();
  for (const [collection, section] of Object.entries(SECTIONS)) {
    const dir = `${root}/${collection}`;
    if (!existsSync(dir)) continue;
    for (const slug of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
      const has = (lang) => existsSync(`${dir}/${slug}/${lang}.md`);
      if (has('zh') && !has('en')) out.add(`/${section}/${slug}/`);
      if (has('en') && !has('zh')) out.add(`/zh/${section}/${slug}/`);
    }
  }
  return out;
}
