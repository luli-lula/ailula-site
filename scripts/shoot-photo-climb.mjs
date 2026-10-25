// Screenshots of realism test A: node scripts/shoot-photo-climb.mjs [baseURL]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch();
for (const [w, h, tag, heights] of [[1440, 900, 'desktop', [0, 20, 33, 60, 88, 115]], [390, 844, 'mobile', [0, 60, 115]]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/lab/photo-climb/`);
  await page.waitForLoadState('networkidle');
  for (const m of heights) {
    await page.evaluate((m) => window.scrollTo(0, (m / 115) * (document.documentElement.scrollHeight - innerHeight)), m);
    await page.waitForFunction((m) => Math.abs(window.__climb?.height - m) < 0.6, m, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `docs/progress/photo-climb-${tag}-${String(m).padStart(3, '0')}m.png` });
  }
  await page.close();
}
await browser.close();
