import { chooseFile } from '../app/fs';
import { loadFile } from '../app/fs';
import { openFile } from '../app/fs';
import { saveFile } from '../app/fs';
import { saveFileAs } from '../app/fs';

import 'jest-extended';

import * as fs from 'fs';

import { dialog } from 'electron';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialogSync: jest.fn(() => ['/home/mflo']),
    showSaveDialogSync: jest.fn(() => '/home/mflo')
  },
  ipcMain: {
    handle: jest.fn()
  }
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => 'data'),
  writeFileSync: jest.fn()
}));

describe('fs', () => {
  it('can choose a file', () => {
    const options = { title: 'My Open File Dialog' };
    const path = chooseFile(null, options);
    expect(path).toBe('/home/mflo');
    expect(dialog.showOpenDialogSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining(options)
    );
  });

  it('can load a file', () => {
    const path = '/home/mflo';
    const data = loadFile(null, path);
    expect(data).toBe('data');
    expect(fs.readFileSync).toHaveBeenCalledWith(path, expect.anything());
  });

  it('can open a file', () => {
    const options = { title: 'My Open File Dialog' };
    const { data, path } = openFile(null, options);
    expect(data).toBe('data');
    expect(path).toBe('/home/mflo');
    expect(dialog.showOpenDialogSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining(options)
    );
  });

  it('can save a file', () => {
    const data = 'xxx';
    const path = '/home/mflo';
    saveFile(null, path, data);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path,
      data,
      expect.anything()
    );
  });

  it('can save a file under a new name', () => {
    const options = { title: 'My Save File Dialog' };
    const data = 'xxx';
    const path = saveFileAs(null, data, options);
    expect(path).toBe('/home/mflo');
    expect(dialog.showSaveDialogSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining(options)
    );
  });
});
