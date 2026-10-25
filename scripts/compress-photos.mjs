// Web versions of the climb photos: 2000px WebP for colour, 768px grey JPEG for depth.
// Run: node scripts/compress-photos.mjs
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const src = new URL('../assets-src/photos/', import.meta.url).pathname;
const dir = new URL('../public/assets/photos/', import.meta.url).pathname;
for (const name of readdirSync(src)) {
  const from = join(src, name);
  if (/^(\d\d-[a-z]+|one-tree)\.jpg$/.test(name)) {
    await sharp(from).resize({ width: name.startsWith("one-tree") ? 2688 : 2000 }).webp({ quality: 80 }).toFile(join(dir, name.replace('.jpg', '.webp')));
  } else if (name.endsWith('-depth.png')) {
    await sharp(from).resize({ width: name.startsWith("one-tree") ? 1024 : 768 }).grayscale().jpeg({ quality: 85 }).toFile(join(dir, name.replace('.png', '.jpg')));
  }
}
for (const n of readdirSync(dir).sort()) console.log(n.padEnd(24), (statSync(join(dir, n)).size / 1024).toFixed(0), 'KB');
