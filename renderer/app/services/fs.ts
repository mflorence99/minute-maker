import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { OpenDialogOptions } from '#mm/common';
import { OpenFileResponse } from '#mm/common';
import { SaveDialogOptions } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class FSService {
  //

  chooseFile(options: OpenDialogOptions): Promise<string> {
    return ipc.invoke(Channels.fsChooseFile, options);
  }

  loadFile(path: string): Promise<string> {
    return ipc.invoke(Channels.fsLoadFile, path);
  }

  openFile(options: OpenDialogOptions): Promise<OpenFileResponse> {
    return ipc.invoke(Channels.fsOpenFile, options);
  }

  saveFile(path: string, data: string): Promise<void> {
    return ipc.invoke(Channels.fsSaveFile, path, data);
  }

  saveFileAs(data: string, options: SaveDialogOptions): Promise<string> {
    return ipc.invoke(Channels.fsSaveFileAs, data, options);
  }
}
