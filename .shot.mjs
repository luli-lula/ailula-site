// node .shot.mjs <out> <path> <zone> <night 0|1> <w> <h>
import { chromium } from '@playwright/test';
const [out, path, zone, night, w, h] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.addInitScript((n) => { localStorage.setItem('ailula-mode', 'hifi'); localStorage.setItem('ailula-night', n); }, night);
await p.goto('http://localhost:4330' + path);
await p.waitForSelector('.valley-label', { timeout: 30000 });
await p.waitForTimeout(1200);
if (zone !== '-') await p.evaluate((z) => window.__valley.select(z), zone);
await p.waitForTimeout(3000);
await p.screenshot({ path: out });
await b.close();
