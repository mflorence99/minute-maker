import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageEngine as NGXSStorageEngine } from '@ngxs/storage-plugin';

import { from } from 'rxjs';
import { tap } from 'rxjs';

// 🙈 preload.ts
declare const ipc /* 🔥 typeof ipcRenderer */;

// 🔥 we believe the NGXS AsyncStorageEngine is no longer supported
//    so in order to preserve synchronous semantics, the store is
//    mirrored in the internal CACHE

const CACHE: Record<string, any> = {};

@Injectable({ providedIn: 'root' })
export class StorageEngine implements NGXSStorageEngine {
  length: number;

  static initialize(): Observable<Record<string, any>> {
    return from(ipc.invoke(Channels.localStorageStore)).pipe(
      tap((store: Record<string, any>) => {
        for (const key in CACHE) delete CACHE[key];
        for (const key in store) CACHE[key] = store[key];
      })
    );
  }

  clear(): void {
    for (const key in CACHE) delete CACHE[key];
    ipc.invoke(Channels.localStorageClear);
  }

  getItem(key: string): any {
    return CACHE[key];
  }

  removeItem(key: string): void {
    delete CACHE[key];
    ipc.invoke(Channels.localStorageRemoveItem, key);
  }

  setItem(key: string, value: any): void {
    CACHE[key] = value;
    ipc.invoke(Channels.localStorageSetItem, key, value);
  }
}
