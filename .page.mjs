import { chromium } from '@playwright/test';
const [out, path, w, h, full] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.addInitScript(() => localStorage.setItem('ailula-mode', 'lofi'));
await p.goto('http://localhost:4330' + path);
await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
