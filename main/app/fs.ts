import { Channels } from './common';
import { OpenDialogOptions } from './common';
import { OpenFileResponse } from './common';
import { SaveDialogOptions } from './common';

import { trunc } from './utils';

import { dialog } from 'electron';
import { ipcMain } from 'electron';
import { readFile } from 'fs/promises';
import { writeFile } from 'fs/promises';

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

export async function loadFile(event, path: string): Promise<string> {
  const data = await readFile(path, { encoding: 'utf8' });
  jsome(`👈  readFile ${path} --> ${trunc(data)}`);
  return data;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsOpenFile --> openFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsOpenFile, openFile);

export async function openFile(
  event,
  options: OpenDialogOptions
): Promise<OpenFileResponse> {
  cleanOptions(options);
  const path = chooseFile(event, options);
  if (path) {
    const data = await loadFile(event, path);
    return { data, path };
  } else return null;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFile --> saveFile
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFile, saveFile);

let pendingWrite: Promise<void> = Promise.resolve();

export async function saveFile(
  event,
  path: string,
  data: string,
  wait: boolean
): Promise<void> {
  jsome(`👈  writeFile ${path} wait:${wait} <-- ${trunc(data)}`);
  // 🔥 failsafe for bugs!!
  if (!data || data === 'null' || data === '{}')
    throw new Error('Writing empty data!!');
  // 👇 this allows us to write without waiting -- at least until
  //    the next write request
  await pendingWrite;
  pendingWrite = writeFile(path, data, { encoding: 'utf8' });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.fsSaveFileAs --> saveFileAs
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.fsSaveFileAs, saveFileAs);

export function saveFileAs(
  event,
  data: string,
  options: SaveDialogOptions,
  wait: boolean
): string {
  cleanOptions(options);
  const path = dialog.showSaveDialogSync(globalThis.theWindow, {
    ...options,
    properties: ['showOverwriteConfirmation']
  });
  if (path) saveFile(event, path, data, wait);
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
