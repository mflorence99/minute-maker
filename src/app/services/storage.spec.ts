import { StorageService } from './storage';

import 'jest-extended';

import { clearMocks } from '@tauri-apps/api/mocks';
import { lastValueFrom } from 'rxjs';
import { mockIPC } from '@tauri-apps/api/mocks';

/* 👇 this is how IPC calls are mocked
  {
    cmd: 'tauri',
    args: {
      __tauriModule: 'Fs',
      message: {
        cmd: 'readTextFile',
        path: 'minute-maker/.config-dev/storage.json',
        options: [Object]
      }
    }
  }
*/

describe('StorageService', () => {
  beforeEach(() => {
    // 🔥 we "know" only fs.readTextFile/writeTextFile are called
    mockIPC((cmd: string, args: any) => {
      const action = `${cmd}.${args.__tauriModule}.${args.message.cmd}`;
      switch (action) {
        case 'tauri.Fs.readTextFile':
          return '{"x": 10}';
        default:
          return undefined;
      }
    });
    // 👇 initialize the storage
    return lastValueFrom(StorageService.initialize());
  });

  afterEach(() => clearMocks());

  it('is initialized correctly', () => {
    const storage = new StorageService();
    expect(storage.getItem('x')).toBe(10);
  });

  it('can be cleared', () => {
    const storage = new StorageService();
    expect(storage.getItem('x')).toBe(10);
    storage.clear();
    expect(storage.getItem('x')).toBeUndefined();
  });

  it('can be set', () => {
    const storage = new StorageService();
    expect(storage.getItem('x')).toBe(10);
    storage.setItem('x', 20);
    expect(storage.getItem('x')).toBe(20);
  });

  it('can have items removed', () => {
    const storage = new StorageService();
    expect(storage.getItem('x')).toBe(10);
    storage.removeItem('x');
    expect(storage.getItem('x')).toBeUndefined();
  });
});
