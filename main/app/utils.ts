import { NativeImage } from 'electron';

import { join } from 'path';
import { nativeImage } from 'electron';
import { readFile } from 'fs/promises';

import sharp from 'sharp';

// //////////////////////////////////////////////////////////////////////////
// 🟦 resolveAllPromises
// //////////////////////////////////////////////////////////////////////////

// 🙈 https://stackoverflow.com/questions/53189292/waiting-for-promises-inside-the-object-to-resolve
export async function resolveAllPromises(obj): Promise<any> {
  const forWaiting = [];
  if (obj && typeof obj.then === 'function') obj = await obj;
  if (!obj || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach((k) => {
    if (obj[k] && typeof obj[k].then == 'function')
      forWaiting.push(obj[k].then((res) => (obj[k] = res)));
    if (obj[k] && typeof obj[k] == 'object')
      forWaiting.push(resolveAllPromises(obj[k]));
  });
  await Promise.all(forWaiting);
  return obj;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 trunc
// //////////////////////////////////////////////////////////////////////////

export function trunc(text: string, maxlen = 100): string {
  return text.length <= maxlen ? text : `${text.substring(0, maxlen)}...`;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 tuiSVGtoPNG - convert SVG in icons lib to nativeImage
// //////////////////////////////////////////////////////////////////////////

const tuiSVGtoPNGCache = new Map<string, NativeImage>();

// 🙈 https://github.com/electron/electron/issues/9642
export async function tuiSVGtoPNG(
  nm: string,
  w = 16,
  h = 16,
  color = '#FFFFFF'
): Promise<NativeImage> {
  // 👇 use cached image if any
  const key = `${nm}-${w}-${h}-${color}`;
  const img = tuiSVGtoPNGfromCache(nm, w, h, color);
  if (img) return img;
  // 👇 otherwise try to convert SVG to PNG
  try {
    const path = join(
      __dirname, // 🔥 this is suspect in production
      '..',
      '..',
      '..',
      'node_modules',
      '@taiga-ui',
      'icons',
      'src',
      `${nm}.svg`
    );
    const svg = await readFile(path, { encoding: 'utf8' });
    const colorized = svg.replaceAll('currentColor', color);
    const png = await sharp(Buffer.from(colorized))
      .png()
      .resize(w, h)
      .toBuffer();
    const img = nativeImage.createFromBuffer(png);
    tuiSVGtoPNGCache.set(key, img);
    return img;
  } catch (error) {
    console.error(`🔥 ${error.message}`);
    return null;
  }
}

export function tuiSVGtoPNGfromCache(
  nm: string,
  w = 16,
  h = 16,
  color = '#FFFFFF'
): NativeImage {
  const key = `${nm}-${w}-${h}-${color}`;
  return tuiSVGtoPNGCache.get(key);
}
