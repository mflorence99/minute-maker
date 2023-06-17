import { Channels } from '#mm/common';
import { StorageEngine } from '#mm/state/storage-engine';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn(() => Promise.resolve({}))
  }
});

declare const ipc;

describe('StorageEngine', () => {
  it('can be initialized', () => {
    StorageEngine.initialize();
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.localStorageStore);
  });

  it('can pass a smoke test', () => {
    const storageEngine = new StorageEngine();
    storageEngine.setItem('xxx', 'yyy');
    expect(storageEngine.getItem('xxx')).toBe('yyy');
    storageEngine.clear();
    expect(storageEngine.getItem('xxx')).toBeUndefined();
    storageEngine.setItem('xxx', 'zzz');
    expect(storageEngine.getItem('xxx')).toBe('zzz');
    storageEngine.removeItem('xxx');
    expect(storageEngine.getItem('xxx')).toBeUndefined();
  });
});
