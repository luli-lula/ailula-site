// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteHeadings from './src/lib/remark-demote-headings.mjs';
import redirects from './src/redirects.json' with { type: 'json' };

export default defineConfig({
  site: 'https://ailula.top',
  trailingSlash: 'always',
  redirects,
  // Lab pages are design experiments: kept for reference, never listed.
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') })],
  markdown: { remarkPlugins: [remarkDemoteHeadings] },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
