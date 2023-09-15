import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { MessageBoxOptions } from '#mm/common';
import { MessageBoxReply } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class DialogService {
  //

  showErrorBox(title: string, contents: string): Promise<void> {
    return ipc.invoke(Channels.dialogShowErrorBox, title, contents);
  }

  showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReply> {
    return ipc.invoke(Channels.dialogShowMessageBox, options);
  }
}
