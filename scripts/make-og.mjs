// Social preview image (public/og.jpg, 1200×630) rendered from the valley itself: node scripts/make-og.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.addInitScript(() => {
  localStorage.setItem('ailula-mode', 'hifi');
  localStorage.setItem('ailula-season', 'autumn');
  localStorage.setItem('ailula-night', '0');
});
await page.goto('http://localhost:4321/');
await page.waitForTimeout(3500);
await page.mouse.move(2, 2);
await page.addStyleTag({ content: `.valley-bar, .valley-hint, .valley-labels, astro-dev-toolbar { display: none !important; }
  .og-title { position: fixed; left: 56px; top: 50px; z-index: 99; font: 700 64px/1 Georgia, serif; color: #2b231b; letter-spacing: .02em; }
  .og-title small { display: block; margin-top: 14px; font: italic 26px/1.3 Georgia, serif; color: #5d4a38; }` });
await page.evaluate(() => {
  const d = document.createElement('div');
  d.className = 'og-title';
  d.innerHTML = 'lula<small>Growing slowly, like a redwood.</small>';
  document.body.appendChild(d);
});
await page.waitForTimeout(600);
const png = await page.screenshot();
await sharp(png).resize(1200, 630).jpeg({ quality: 86 }).toFile('public/og.jpg');
await browser.close();
console.log('public/og.jpg');
