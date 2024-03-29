import { Channels } from './common';

import { ipcMain } from 'electron';

import isDev from 'electron-is-dev';
import Store from 'electron-store';

export const store = new Store({
  name: isDev ? 'config.dev' : 'config.prod'
});

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.localStorageClear --> localStorageClear
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.localStorageClear, localStorageClear);

export function localStorageClear(): void {
  store.clear();
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.localStorageGetItem --> localStorageGetItem
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.localStorageGetItem, localStorageGetItem);

export function localStorageGetItem(event, key: string): any {
  return store.get(key);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.localStorageRemoveItem --> localStorageRemoveItem
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.localStorageRemoveItem, localStorageRemoveItem);

export function localStorageRemoveItem(event, key: string): void {
  store.delete(key);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.localStorageSetItem --> localStorageSetItem
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.localStorageSetItem, localStorageSetItem);

export function localStorageSetItem(event, key: string, value: any): void {
  store.set(key, value);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.localStorageStore --> localStorageStore
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.localStorageStore, localStorageStore);

export function localStorageStore(_event): Record<string, any> {
  return store.store;
}
