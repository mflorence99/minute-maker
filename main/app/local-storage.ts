import { Channels } from './common';

import { ipcMain } from 'electron';

import isDev from 'electron-is-dev';
import Store from 'electron-store';

export const store = new Store({
  name: isDev ? 'config.dev' : 'config.prod'
});

ipcMain.handle(Channels.localStorageClear, localStorageClear);
ipcMain.handle(Channels.localStorageGetItem, localStorageGetItem);
ipcMain.handle(Channels.localStorageRemoveItem, localStorageRemoveItem);
ipcMain.handle(Channels.localStorageSetItem, localStorageSetItem);
ipcMain.handle(Channels.localStorageStore, localStorageStore);

// 👇 exported for tests

export function localStorageClear(): void {
  store.clear();
}

export function localStorageGetItem(event, key: string): any {
  return store.get(key);
}

export function localStorageRemoveItem(event, key: string): void {
  store.delete(key);
}

export function localStorageSetItem(event, key: string, value: any): void {
  store.set(key, value);
}

export function localStorageStore(_event): Record<string, any> {
  return store.store;
}
