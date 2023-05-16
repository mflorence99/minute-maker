import { environment } from '../environment';

import { BaseDirectory } from '@tauri-apps/api/fs';
import { Observable } from 'rxjs';
import { StorageEngine } from '@ngxs/storage-plugin';

import { createDir } from '@tauri-apps/api/fs';
import { from } from 'rxjs';
import { readTextFile } from '@tauri-apps/api/fs';
import { writeTextFile } from '@tauri-apps/api/fs';

export class StorageService implements StorageEngine {
  static #dir = `${environment.package.name}/${environment.mode()}`;

  static #fn = `${StorageService.#dir}/storage.json`;

  static #state: Record<string, any> = {};

  readonly length = 0;

  static initialize(): Observable<Record<string, any>> {
    return from(StorageService.#deserialize());
  }

  static #deserialize(): Promise<Record<string, any>> {
    return readTextFile(StorageService.#fn, {
      dir: BaseDirectory.AppConfig
    })
      .then((contents) => (StorageService.#state = JSON.parse(contents)))
      .catch(() => ({}));
  }

  async clear(): Promise<void> {
    StorageService.#state = {};
    await this.#serialize();
  }

  getItem(key: string): any {
    return StorageService.#state[key];
  }

  async removeItem(key: string): Promise<void> {
    delete StorageService.#state[key];
    await this.#serialize();
  }

  async setItem(key: string, value: any): Promise<void> {
    StorageService.#state[key] = value;
    await this.#serialize();
  }

  async #serialize(): Promise<void> {
    await createDir(StorageService.#dir, {
      dir: BaseDirectory.AppConfig,
      recursive: true
    });
    await writeTextFile(
      StorageService.#fn,
      JSON.stringify(StorageService.#state),
      {
        dir: BaseDirectory.AppConfig
      }
    );
  }
}
