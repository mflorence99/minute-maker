import { Channels } from './common';
import { OpenDialogOptions } from './common';
import { OpenFileResponse } from './common';
import { SaveDialogOptions } from './common';

import { dialog } from 'electron';
import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

// 🔥 only text files are handled

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsChooseFile --> chooseFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsChooseFile, chooseFile);

// 👇 exported for tests
export function chooseFile(event, options: OpenDialogOptions): string {
  cleanOptions(options);
  const paths = dialog.showOpenDialogSync(globalThis.theWindow, {
    ...options,
    properties: ['openFile']
  });
  return paths?.[0];
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsLoadFile --> loadFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsLoadFile, loadFile);

// 👇 exported for tests
export function loadFile(event, path: string): string {
  return readFileSync(path, { encoding: 'utf8' });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsOpenFile --> openFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsOpenFile, openFile);

// 👇 exported for tests
export function openFile(event, options: OpenDialogOptions): OpenFileResponse {
  cleanOptions(options);
  const path = chooseFile(event, options);
  return path ? { data: loadFile(event, path), path } : null;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFile --> saveFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFile, saveFile);

// 👇 exported for tests
export function saveFile(event, path: string, data: string): void {
  return writeFileSync(path, data, { encoding: 'utf8' });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFileAs --> saveFileAs
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFileAs, saveFileAs);

// 👇 exported for tests
export function saveFileAs(
  event,
  data: string,
  options: SaveDialogOptions
): string {
  cleanOptions(options);
  const path = dialog.showSaveDialogSync(globalThis.theWindow, {
    ...options,
    properties: ['showOverwriteConfirmation']
  });
  if (path) saveFile(event, path, data);
  return path;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

// 🕥 appears to be a problem where a null or undefined defaultPath
//    throws an exception
function cleanOptions(options: OpenDialogOptions | SaveDialogOptions): void {
  if (options.hasOwnProperty('defaultPath') && options.defaultPath == null)
    delete options.defaultPath;
}
