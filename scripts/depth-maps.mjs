// Precomputes a depth map per climb photo (bright = near) for the parallax shader.
// Run: node scripts/depth-maps.mjs   (downloads the Depth Anything V2 small model on first run)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';

// Originals live in assets-src/ (not shipped); compress-photos.mjs writes the web copies.
const dir = new URL('../assets-src/photos/', import.meta.url).pathname;
const estimate = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });

for (const name of readdirSync(dir).filter((n) => /^\d\d-.*\.jpg$/.test(n) && !n.includes('-depth'))) {
  // Work on a 1024px copy; depth maps only need to be soft.
  const input = await sharp(join(dir, name)).resize({ width: 1024 }).jpeg().toBuffer();
  const blob = new Blob([input], { type: 'image/jpeg' });
  const { depth } = await estimate(URL.createObjectURL ? blob : blob);
  const out = join(dir, name.replace('.jpg', '-depth.png'));
  await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: 1 } })
    .blur(2)
    .png()
    .toFile(out);
  console.log(name, '→', depth.width, 'x', depth.height);
}
