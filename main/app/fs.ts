import { Channels } from './common';
import { OpenDialogOptions } from './common';
import { OpenFileResponse } from './common';
import { SaveDialogOptions } from './common';

import { dialog } from 'electron';
import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

// 🔥 text files ONLY!

ipcMain.handle(Channels.fsChooseFile, chooseFile);
ipcMain.handle(Channels.fsLoadFile, loadFile);
ipcMain.handle(Channels.fsOpenFile, openFile);
ipcMain.handle(Channels.fsSaveFile, saveFile);
ipcMain.handle(Channels.fsSaveFileAs, saveFileAs);

// 👇 exported for tests

export function chooseFile(event, options: OpenDialogOptions): string {
  const paths = dialog.showOpenDialogSync(globalThis.theWindow, {
    ...options,
    properties: ['openFile']
  });
  return paths?.[0];
}

export function loadFile(event, path: string): string {
  return readFileSync(path, { encoding: 'utf8' });
}

export function openFile(event, options: OpenDialogOptions): OpenFileResponse {
  const path = chooseFile(event, options);
  return path ? { data: loadFile(event, path), path } : null;
}

export function saveFile(event, path: string, data: string): void {
  return writeFileSync(path, data, { encoding: 'utf8' });
}

export function saveFileAs(
  event,
  data: string,
  options: SaveDialogOptions
): string {
  const path = dialog.showSaveDialogSync(globalThis.theWindow, {
    ...options,
    properties: ['showOverwriteConfirmation']
  });
  if (path) saveFile(event, path, data);
  return path;
}
