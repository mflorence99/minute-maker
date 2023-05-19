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

const cache: Record<string, any> = {};
const dir = `${environment.package.name}/${environment.mode()}`;
const fn = `${dir}/storage.json`;

export class FsStorageEngine implements StorageEngine {
  get length(): number {
    return Object.keys(cache).length;
  }

  static initialize(): Observable<Record<string, any>> {
    return from(FsStorageEngine.#deserialize());
  }

  static #deserialize(): Promise<Record<string, any>> {
    return readTextFile(fn, {
      dir: BaseDirectory.AppConfig
    })
      .then((contents) => {
        for (const key in cache) delete cache[key];
        const parsed = JSON.parse(contents);
        for (const key in parsed) cache[key] = parsed[key];
        return cache;
      })
      .catch((error) => {
        console.error(`🔥 ${error.message}`);
        Sentry.captureMessage(`deserialize failed with ${error.message}`);
        return {};
      });
  }

  async clear(): Promise<void> {
    for (const key in cache) delete cache[key];
    await this.#serialize();
  }

  getItem(key: string): any {
    return cache[key];
  }

  async removeItem(key: string): Promise<void> {
    delete cache[key];
    await this.#serialize();
  }

  async setItem(key: string, value: any): Promise<void> {
    cache[key] = value;
    await this.#serialize();
  }

  async #serialize(): Promise<void> {
    await createDir(dir, {
      dir: BaseDirectory.AppConfig,
      recursive: true
    });
    await writeTextFile(fn, JSON.stringify(cache), {
      dir: BaseDirectory.AppConfig
    });
  }
}
