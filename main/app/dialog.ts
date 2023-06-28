import { Channels } from './common';

import { dialog } from 'electron';
import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.dialogShowErrorBox --> showErrorBox
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.dialogShowErrorBox, showErrorBox);

// 👇 exported for tests
export function showErrorBox(event, title: string, content: string): void {
  dialog.showErrorBox(title, content);
}
