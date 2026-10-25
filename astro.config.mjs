// @ts-check
import { defineConfig } from 'astro/config';
import remarkDemoteHeadings from './src/lib/remark-demote-headings.mjs';
import redirects from './src/redirects.json' with { type: 'json' };

export default defineConfig({
  site: 'https://ailula.top',
  trailingSlash: 'always',
  redirects,
  markdown: { remarkPlugins: [remarkDemoteHeadings] },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
