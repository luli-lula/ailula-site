// Screenshots of the editorial direction test: node scripts/shoot-editorial.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:4321/lab/editorial/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `docs/progress/editorial-${tag}-hero.png` });
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.9));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `docs/progress/editorial-${tag}-chapter.png` });
  await page.close();
}
await browser.close();
