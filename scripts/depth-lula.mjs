// Depth maps + web copies for lula's own sequoia photos (assets-src/photos/lula → public/assets/photos/lula).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';

const src = new URL('../assets-src/photos/lula/', import.meta.url).pathname;
const out = new URL('../public/assets/photos/lula/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const estimate = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });
for (const n of ['1', '2', '3']) {
  const input = await sharp(join(src, `${n}.jpg`)).rotate().toBuffer();
  await sharp(input).webp({ quality: 85 }).toFile(join(out, `${n}.webp`));
  const { depth } = await estimate(new Blob([await sharp(input).jpeg().toBuffer()], { type: 'image/jpeg' }));
  await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: 1 } }).blur(1.5).jpeg({ quality: 88 }).toFile(join(out, `${n}-depth.jpg`));
  console.log(n, depth.width, 'x', depth.height);
}
