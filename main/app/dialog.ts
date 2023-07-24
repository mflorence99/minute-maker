import { Channels } from './common';
import { MessageBoxOptions } from './common';

import { dialog } from 'electron';
import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.dialogShowErrorBox --> showErrorBox
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.dialogShowErrorBox, showErrorBox);

export function showErrorBox(event, title: string, content: string): void {
  dialog.showErrorBox(title, content);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.dialogShowMessageBox --> showMessageBox
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.dialogShowMessageBox, showMessageBox);

export function showMessageBox(event, options: MessageBoxOptions): number {
  return dialog.showMessageBoxSync(globalThis.theWindow, options);
}
