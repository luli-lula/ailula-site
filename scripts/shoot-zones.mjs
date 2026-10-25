// One screenshot per zone view in the valley lab: node scripts/shoot-zones.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('http://localhost:4321/lab/valley/?season=spring');
await page.waitForTimeout(2500);
for (const z of ['tree', 'hollow', 'workshop', 'garden', 'lookout', 'dog']) {
  await page.evaluate((z) => window.__valley.focus(z), z);
  await page.waitForTimeout(z === 'tree' ? 7500 : 2200);
  await page.screenshot({ path: `docs/progress/valley-zone-${z}.png` });
}
await browser.close();
