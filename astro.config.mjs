// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteHeadings from './src/lib/remark-demote-headings.mjs';
import redirects from './src/redirects.json' with { type: 'json' };
import { fallbackPaths } from './src/lib/fallback-pages.mjs';

const fallbacks = fallbackPaths();

export default defineConfig({
  site: 'https://ailula.top',
  trailingSlash: 'always',
  redirects,
  // Lab pages are design experiments, and fallback pages copy another language: neither is listed.
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !fallbacks.has(decodeURI(new URL(page).pathname)) })],
  markdown: { remarkPlugins: [remarkDemoteHeadings] },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
