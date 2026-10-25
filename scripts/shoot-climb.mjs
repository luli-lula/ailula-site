// Captures the realism-test screenshots for review: node scripts/shoot-climb.mjs [baseURL]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/lab/climb/`);
  await page.getByTestId('loading').waitFor({ state: 'detached', timeout: 60_000 });
  for (const m of tag === 'desktop' ? [0, 40, 80, 110, 115] : [0, 115]) {
    await page.evaluate((m) => window.scrollTo(0, (m / 115) * (document.documentElement.scrollHeight - innerHeight)), m);
    await page.waitForFunction((m) => Math.abs(window.__climb?.height - m) < 0.6, m, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `docs/progress/climb-${tag}-${String(m).padStart(3, '0')}m.png` });
  }
  await page.close();
}
await browser.close();
