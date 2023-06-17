import { showErrorBox } from '../app/dialog';

import 'jest-extended';

import { dialog } from 'electron';

jest.mock('electron', () => ({
  dialog: {
    showErrorBox: jest.fn()
  },
  ipcMain: {
    handle: jest.fn()
  }
}));

describe('fs', () => {
  it('can show an error box', () => {
    showErrorBox(null, 'title', 'contents');
    expect(dialog.showErrorBox).toHaveBeenCalledWith('title', 'contents');
  });
});
