import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { StorageEngine as NGXSStorageEngine } from '@ngxs/storage-plugin';

// 🙈 preload.ts
declare const ipc /* 🔥 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class StorageEngine implements NGXSStorageEngine {
  length: number;

  clear(): void {
    ipc.invoke(Channels.localStorageClear);
  }

  getItem(key: string): any {
    return ipc.invoke(Channels.localStorageGetItem, key);
  }

  removeItem(key: string): void {
    ipc.invoke(Channels.localStorageRemoveItem, key);
  }

  setItem(key: string, value: any): void {
    ipc.invoke(Channels.localStorageSetItem, key, value);
  }
}
