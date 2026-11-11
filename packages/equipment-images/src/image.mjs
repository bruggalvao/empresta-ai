// The 800x600 guarantee lives here: every file that can reach Storage is
// produced by toExactSize and checked again by readSize before upload.

import { createHash } from 'node:crypto';
import { Jimp } from 'jimp';
import { HEIGHT, JPEG_QUALITY, WIDTH } from './config.mjs';

export async function readSize(buffer) {
  const img = await Jimp.read(buffer);
  return { width: img.bitmap.width, height: img.bitmap.height };
}

// Center-crops to 4:3 and scales down to exactly WIDTH x HEIGHT. Refuses
// sources smaller than the target: a photo is cropped, never stretched.
export async function toExactSize(buffer) {
  const img = await Jimp.read(buffer);
  const { width, height } = img.bitmap;
  if (width < WIDTH || height < HEIGHT) {
    throw new Error(`imagem de origem menor que ${WIDTH}×${HEIGHT} (${width}×${height})`);
  }
  img.cover({ w: WIDTH, h: HEIGHT });
  const out = await img.getBuffer('image/jpeg', { quality: JPEG_QUALITY });
  const size = await readSize(out);
  if (size.width !== WIDTH || size.height !== HEIGHT) {
    throw new Error(`recorte gerou ${size.width}×${size.height}, esperado ${WIDTH}×${HEIGHT}`);
  }
  return out;
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function md5(buffer) {
  return createHash('md5').update(buffer).digest('hex');
}
