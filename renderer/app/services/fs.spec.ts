import { Channels } from '#mm/common';
import { FSService } from '#mm/services/fs';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('FSService', () => {
  it('uses the fsLoadFile channel to load a file', () => {
    const fs = new FSService();
    fs.loadFile(__filename);
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.fsLoadFile, __filename);
  });

  it('uses the fsLocateFile channel to locate a file', () => {
    const fs = new FSService();
    const options = { title: 'My Open File Dialog' };
    fs.locateFile(options);
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.fsLocateFile, options);
  });

  it('uses the fsOpenFile channel to open a file', () => {
    const fs = new FSService();
    const options = { title: 'My Open File Dialog' };
    fs.openFile(options);
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.fsOpenFile, options);
  });

  it('uses the fsSaveFile channel to save a file', () => {
    const fs = new FSService();
    fs.saveFile(__filename, 'xxx');
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.fsSaveFile,
      __filename,
      'xxx'
    );
  });

  it('uses the fsSaveFileAs channel to save a file under a new name', () => {
    const fs = new FSService();
    const options = { title: 'My Open File Dialog' };
    fs.saveFileAs('xxx', options);
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.fsSaveFileAs,
      'xxx',
      options
    );
  });
});
