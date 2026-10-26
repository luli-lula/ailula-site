// Web versions of lula's photos: every assets-src/photos/<album>/<name>.(jpg|jpeg|png|heic) becomes
// public/assets/photos/<album>/<name>.webp, at most 1600px wide. Existing web files are skipped.
// Run: node scripts/compress-photos.mjs
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const src = new URL('../assets-src/photos/', import.meta.url).pathname;
const out = new URL('../public/assets/photos/', import.meta.url).pathname;
for (const album of readdirSync(src).filter((n) => statSync(join(src, n)).isDirectory())) {
  mkdirSync(join(out, album), { recursive: true });
  for (const name of readdirSync(join(src, album)).filter((n) => /\.(jpe?g|png|heic)$/i.test(n))) {
    const to = join(out, album, name.replace(/\.[^.]+$/, '.webp'));
    if (existsSync(to)) continue;
    await sharp(join(src, album, name)).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(to);
    console.log(`${album}/${name} → ${(statSync(to).size / 1024).toFixed(0)} KB`);
  }
}
