import { AudioMetadata } from '#mm/common';
import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class MetadataService {
  parseFile(fileName: string): Promise<AudioMetadata> {
    return ipc.invoke(Channels.metadataParseFile, fileName);
  }
}
