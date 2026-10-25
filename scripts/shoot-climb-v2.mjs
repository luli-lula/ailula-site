// Screenshots of realism test C (3D v2): node scripts/shoot-photo-climb.mjs [baseURL]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [w, h, tag, heights] of [[1440, 900, 'desktop', [0, 15, 45, 80, 100, 115]], [390, 844, 'mobile', [0, 60, 115]]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/lab/climb-v2/`);
  await page.getByTestId("loading").waitFor({ state: "detached", timeout: 90_000 });
  for (const m of heights) {
    await page.evaluate((m) => window.scrollTo(0, (m / 115) * (document.documentElement.scrollHeight - innerHeight)), m);
    await page.waitForFunction((m) => Math.abs(window.__climb?.height - m) < 0.6, m, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `docs/progress/climb-v2-${tag}-${String(m).padStart(3, '0')}m.png` });
  }
  await page.close();
}
await browser.close();
