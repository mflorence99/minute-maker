import { Channels } from './common';
import { OpenDialogOptions } from './common';
import { OpenFileResponse } from './common';
import { SaveDialogOptions } from './common';

import { trunc } from './utils';

import { dialog } from 'electron';
import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import jsome from 'jsome';

// 🔥 only text files are handled

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsChooseFile --> chooseFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsChooseFile, chooseFile);

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

export function loadFile(event, path: string): string {
  const data = readFileSync(path, { encoding: 'utf8' });
  jsome(`👈 readFileSync ${path} --> ${trunc(data)}`);
  return data;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsOpenFile --> openFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsOpenFile, openFile);

export function openFile(event, options: OpenDialogOptions): OpenFileResponse {
  cleanOptions(options);
  const path = chooseFile(event, options);
  return path ? { data: loadFile(event, path), path } : null;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFile --> saveFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFile, saveFile);

export function saveFile(event, path: string, data: string): void {
  jsome(`👈 writeFileSync ${path} <-- ${trunc(data)}`);
  return writeFileSync(path, data, { encoding: 'utf8' });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFileAs --> saveFileAs
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFileAs, saveFileAs);

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
