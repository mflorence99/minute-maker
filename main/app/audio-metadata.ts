import { AudioMetadata } from './common';
import { Channels } from './common';

import { extname } from 'path';
import { ipcMain } from 'electron';
import { parseFile } from 'music-metadata';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.metadataParseFile --> metadataParseFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.metadataParseFile, metadataParseFile);

export async function metadataParseFile(
  event,
  fileName: string
): Promise<AudioMetadata> {
  const metadata = await parseFile(fileName, { duration: true });
  const encoding = extname(fileName).substring(1).toUpperCase();
  return { ...metadata.format, encoding } as AudioMetadata;
}
