import { Channels } from '#mm/common';
import { DialogService } from '#mm/services/dialog';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('DialogService', () => {
  it('uses the dialogShowErrorBox channel to show an error message', () => {
    const dialog = new DialogService();
    dialog.showErrorBox('title', 'contents');
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.dialogShowErrorBox,
      'title',
      'contents'
    );
  });
});
