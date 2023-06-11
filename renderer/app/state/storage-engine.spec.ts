import { Channels } from '#mm/common';
import { StorageEngine } from '#mm/state/storage-engine';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('StorageEngine', () => {
  it('invokes the localStorageClear channel', () => {
    const storageEngine = new StorageEngine();
    storageEngine.clear();
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.localStorageClear);
  });

  // 👇 no longer get directly
  it.skip('invokes the localStorageGetItem channel', () => {
    const storageEngine = new StorageEngine();
    storageEngine.getItem('xxx');
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.localStorageGetItem,
      'xxx'
    );
  });

  it('invokes the localStorageRemoveItem channel', () => {
    const storageEngine = new StorageEngine();
    storageEngine.removeItem('xxx');
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.localStorageRemoveItem,
      'xxx'
    );
  });

  it('invokes the localStorageSetItem channel', () => {
    const storageEngine = new StorageEngine();
    storageEngine.setItem('xxx', 'yyy');
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.localStorageSetItem,
      'xxx',
      'yyy'
    );
  });
});
