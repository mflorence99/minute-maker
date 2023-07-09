import { NativeImage } from 'electron';

import { join } from 'path';
import { nativeImage } from 'electron';
import { readFile } from 'fs/promises';

import memoize from 'memoizee';
import sharp from 'sharp';

// //////////////////////////////////////////////////////////////////////////
// 🟦 trunc
// //////////////////////////////////////////////////////////////////////////

export function trunc(text: string, maxlen = 100): string {
  return text.length < maxlen ? text : `${text.substring(0, maxlen)}...`;
}

async function toPNGImpl(
  nm: string,
  w: number,
  h: number
): Promise<NativeImage> {
  // /home/mflo/mflorence99/minute-maker/node_modules/@taiga-ui/icons/src/tuiIconXOctagon.svg
  const path = join(
    __dirname,
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
  const png = await sharp(svg).png().resize(w, h).toBuffer();
  return nativeImage.createFromBuffer(png);
}

export const toPNG = memoize(toPNGImpl);
