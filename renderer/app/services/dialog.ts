import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class DialogService {
  //

  showErrorBox(title: string, contents: string): Promise<void> {
    return ipc.invoke(Channels.dialogShowErrorBox, title, contents);
  }
}
