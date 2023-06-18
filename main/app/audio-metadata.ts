import { AudioMetadata } from './common';
import { Channels } from './common';

import { extname } from 'path';
import { ipcMain } from 'electron';
import { parseFile } from 'music-metadata';

ipcMain.handle(Channels.metadataParseFile, metadataParseFile);

// 👇 exported for tests

export async function metadataParseFile(
  event,
  fileName: string
): Promise<AudioMetadata> {
  const metadata = await parseFile(fileName);
  const extension = extname(fileName).substring(1).toUpperCase();
  return { ...metadata.format, extension } as AudioMetadata;
}
