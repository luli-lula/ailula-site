// Renders public/favicon.svg into the PNG/ICO files older browsers and iOS ask for.
// Run: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const render = async (size, bg = 'transparent') => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${bg}">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ omitBackground: bg === 'transparent' });
};
// iOS draws its own rounded corners, so the touch icon is square and opaque.
writeFileSync('public/apple-touch-icon.png', await render(180, '#f3eee6'));
const png32 = await render(32);
await browser.close();

// An .ico holding one 32×32 PNG (supported by every browser since IE Vista era).
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));
console.log('apple-touch-icon.png, favicon.ico written');
