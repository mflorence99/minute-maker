import { localStorageClear } from '../app/local-storage';
import { localStorageGetItem } from '../app/local-storage';
import { localStorageRemoveItem } from '../app/local-storage';
import { localStorageSetItem } from '../app/local-storage';

import 'jest-extended';

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn()
  }
}));

jest.mock('electron-is-dev', () => true);

jest.mock('electron-store', () => {
  return jest.fn(() => {
    let store = {};
    return {
      clear: jest.fn(() => (store = {})),
      delete: jest.fn((key) => delete store[key]),
      get: jest.fn((key) => store[key]),
      set: jest.fn((key, value) => (store[key] = value))
    };
  });
});

describe('local-storage', () => {
  it('can pass smoke test', () => {
    localStorageSetItem(null, 'xxx', 'yyy');
    expect(localStorageGetItem(null, 'xxx')).toBe('yyy');
    localStorageClear();
    expect(localStorageGetItem(null, 'xxx')).toBeUndefined();
    localStorageSetItem(null, 'xxx', 'zzz');
    expect(localStorageGetItem(null, 'xxx')).toBe('zzz');
    localStorageRemoveItem(null, 'xxx');
    expect(localStorageGetItem(null, 'xxx')).toBeUndefined();
  });
});
