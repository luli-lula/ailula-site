// Screenshots of the Hi-Fi home valley: node scripts/shoot-home.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const shots = [
  ['desktop', 1440, 900, '/', { season: 'autumn', night: '0' }, null],
  ['desktop-night', 1440, 900, '/', { season: 'summer', night: '1' }, null],
  ['desktop-workshop', 1440, 900, '/', { season: 'spring', night: '0' }, 'workshop'],
  ['desktop-zh-tree', 1440, 900, '/zh/', { season: 'winter', night: '0' }, 'tree'],
  ['mobile', 390, 844, '/zh/', { season: 'spring', night: '0' }, null],
  ['mobile-garden', 390, 844, '/', { season: 'spring', night: '0' }, 'garden'],
];
for (const [name, w, h, path, prefs, zone] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.addInitScript((p) => {
    localStorage.setItem('ailula-mode', 'hifi');
    localStorage.setItem('ailula-season', p.season);
    localStorage.setItem('ailula-night', p.night);
  }, prefs);
  await page.goto(`http://localhost:4321${path}`);
  await page.waitForTimeout(3500);
  if (zone) {
    await page.mouse.move(10, 10);
    await page.evaluate((z) => window.__valley.focus(z), zone);
    await page.evaluate((z) => document.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== z)), zone);
    await page.waitForTimeout(zone === 'tree' ? 7500 : 2400);
  }
  await page.screenshot({ path: `docs/progress/home-valley-${name}.png` });
  await page.close();
}
await browser.close();
