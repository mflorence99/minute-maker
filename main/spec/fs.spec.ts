import { loadFile } from '../app/fs';
import { locateFile } from '../app/fs';

import 'jest-extended';

import * as fs from 'fs';

import { dialog } from 'electron';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialogSync: jest.fn(() => ['/home/mflo'])
  },
  ipcMain: {
    handle: jest.fn()
  }
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'data')
}));

describe('fs', () => {
  it('can load a file', () => {
    const path = '/home/mflo';
    const data = loadFile(null, path);
    expect(data).toBe('data');
    expect(fs.readFileSync).toHaveBeenCalledWith(path, expect.anything());
  });

  it('can locate a file', () => {
    const options = { title: 'My Open File Dialog' };
    const path = locateFile(null, options);
    expect(path).toBe('/home/mflo');
    expect(dialog.showOpenDialogSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining(options)
    );
  });
});
