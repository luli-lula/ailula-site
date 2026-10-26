// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteHeadings from './src/lib/remark-demote-headings.mjs';
import redirects from './src/redirects.json' with { type: 'json' };
import { fallbackPaths } from './src/lib/fallback-pages.mjs';
import { normalizeFootprints } from './src/lib/footprints-file.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';

// Local-only helpers for the footprint editor (/map/edit/). They exist on the dev server, never in the build:
// GET/POST /__footprints reads and saves src/data/footprints.json; POST /__geo?iso=KOR downloads one more
// country's city-level boundaries with scripts/build-geo.mjs.
const footprintEditor = {
  name: 'footprint-editor',
  hooks: {
    'astro:server:setup': ({ server }) => {
      const file = new URL('./src/data/footprints.json', import.meta.url);
      server.middlewares.use('/__footprints', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('content-type', 'application/json');
          return res.end(readFileSync(file));
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const clean = normalizeFootprints(JSON.parse(body));
            writeFileSync(file, JSON.stringify(clean, null, 2) + '\n');
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(clean));
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e.message));
          }
        });
      });
      server.middlewares.use('/__geo', (req, res) => {
        const iso = new URL(req.url ?? '', 'http://x').searchParams.get('iso') ?? '';
        if (req.method !== 'POST' || !/^[A-Z]{3}$/.test(iso)) {
          res.statusCode = 400;
          return res.end('POST /__geo?iso=XXX');
        }
        execFile('node', [new URL('./scripts/build-geo.mjs', import.meta.url).pathname, iso], (err, stdout, stderr) => {
          res.statusCode = err ? 500 : 200;
          res.end(err ? stderr || err.message : stdout);
        });
      });
    },
  },
};

const fallbacks = fallbackPaths();

export default defineConfig({
  site: 'https://ailula.top',
  trailingSlash: 'always',
  redirects,
  // Lab pages are design experiments, and fallback pages copy another language: neither is listed.
  integrations: [
    sitemap({ filter: (page) => !page.includes('/lab/') && !page.includes('/map/edit/') && !fallbacks.has(decodeURI(new URL(page).pathname)) }),
    footprintEditor,
  ],
  markdown: { remarkPlugins: [remarkDemoteHeadings] },
  vite: {
    plugins: [
      {
        // Saving footprints from the editor must not reload the editor itself: drop the hot update for that
        // file, but invalidate it so the next page that is opened reads the new data.
        name: 'footprints-no-reload',
        enforce: 'pre',
        handleHotUpdate({ file, modules, server }) {
          if (!file.endsWith('/src/data/footprints.json')) return;
          modules.forEach((m) => server.moduleGraph.invalidateModule(m));
          return [];
        },
      },
    ],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
