// Screenshots of the valley lab: node scripts/shoot-valley.mjs [name] [query...]
import { chromium } from '@playwright/test';

const name = process.argv[2] ?? 'valley';
const queries = process.argv.slice(3).length ? process.argv.slice(3) : ['season=spring'];
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  for (const q of queries) {
    await page.goto(`http://localhost:4321/lab/valley/?${q}`);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `docs/progress/${name}-${tag}-${q.replace(/[^a-z0-9]+/gi, '-')}.png` });
  }
  await page.close();
}
await browser.close();
