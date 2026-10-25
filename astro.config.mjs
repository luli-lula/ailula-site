// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ailula.top',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
