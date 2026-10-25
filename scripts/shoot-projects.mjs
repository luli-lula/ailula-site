// Screenshots of the live project sites for project cards: node scripts/shoot-projects.mjs
// Read-only visits; originals go to assets-src/projects, web copies to public/assets/projects.
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const SITES = {
  toefl: 'https://toefl.ailula.top/',
  celpip12: 'https://celpip.ailula.top/',
  'adhd-focus': 'https://adhd-focus.ailula.top/',
  factreview: 'https://factreview.ailula.top/',
  'piano-trainer': 'https://piano-trainer-gamma.vercel.app/',
  justsay: 'https://interview-vert-chi.vercel.app/',
  'plant-care-signs': 'https://ailula.top/plant-care-signs/',
  'wildones-guide': 'https://wocrny-guidebook.vercel.app/',
};
const browser = await chromium.launch();
for (const [slug, url] of Object.entries(SITES)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1500);
    const png = `assets-src/projects/${slug}.png`;
    await page.screenshot({ path: png });
    await sharp(png).resize({ width: 960 }).webp({ quality: 80 }).toFile(`public/assets/projects/${slug}.webp`);
    console.log(slug, res?.status(), page.url());
  } catch (e) {
    console.log(slug, 'FAILED', String(e).slice(0, 120));
  }
  await page.close();
}
await browser.close();
