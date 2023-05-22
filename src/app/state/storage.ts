import { environment } from '../environment';

import * as Sentry from '@sentry/angular-ivy';

import { BaseDirectory } from '@tauri-apps/api/fs';
import { Observable } from 'rxjs';
import { StorageEngine } from '@ngxs/storage-plugin';

import { createDir } from '@tauri-apps/api/fs';
import { from } from 'rxjs';
import { readTextFile } from '@tauri-apps/api/fs';
import { writeTextFile } from '@tauri-apps/api/fs';

// 🔥 we believe the NGXS FsStorageEngine is no longer supported
//    so in order to preserve synchronous semantics, the store is
//    mirrored in the private #cache

const CACHE: Record<string, any> = {};
const DIR = `${environment.package.name}/${environment.mode()}`;
const FN = `${DIR}/storage.json`;

export class FsStorageEngine implements StorageEngine {
  get length(): number {
    return Object.keys(CACHE).length;
  }

  static initialize(): Observable<Record<string, any>> {
    return from(FsStorageEngine.#deserialize());
  }

  static #deserialize(): Promise<Record<string, any>> {
    return readTextFile(FN, {
      dir: BaseDirectory.AppConfig
    })
      .then((contents) => {
        for (const key in CACHE) delete CACHE[key];
        const parsed = JSON.parse(contents);
        for (const key in parsed) CACHE[key] = parsed[key];
        return CACHE;
      })
      .catch((error) => {
        console.error(`🔥 ${error.message}`);
        Sentry.captureMessage(`deserialize failed with ${error.message}`);
        return {};
      });
  }

  async clear(): Promise<void> {
    for (const key in CACHE) delete CACHE[key];
    await this.#serialize();
  }

  getItem(key: string): any {
    return CACHE[key];
  }

  async removeItem(key: string): Promise<void> {
    delete CACHE[key];
    await this.#serialize();
  }

  async setItem(key: string, value: any): Promise<void> {
    CACHE[key] = value;
    await this.#serialize();
  }

  async #serialize(): Promise<void> {
    await createDir(DIR, {
      dir: BaseDirectory.AppConfig,
      recursive: true
    });
    await writeTextFile(FN, JSON.stringify(CACHE), {
      dir: BaseDirectory.AppConfig
    });
  }
}
