import { Channels } from '../app/common';
import { MenuID } from '../app/common';

import { findMenuItem } from '../app/menu';
import { menuEnable } from '../app/menu';
import { menuTemplate } from '../app/menu';

import 'jest-extended';

const mockMenuSelected = jest.fn(() => {});

globalThis.theWindow = {
  webContents: {
    send: mockMenuSelected
  }
};

jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn()
  },
  Menu: {
    getApplicationMenu: jest.fn(() => menuTemplate)
  }
}));

describe('menu', () => {
  it('can find a menu item from its ID', () => {
    let menuItem = findMenuItem(MenuID.redo);
    expect(menuItem.id).toBe(MenuID.redo);
    menuItem = findMenuItem('xxx' as MenuID);
    expect(menuItem).toBeNull();
  });

  it('can enable/disable menu items', () => {
    menuEnable(null, { [MenuID.open]: true, [MenuID.redo]: true });
    let menuItem = findMenuItem(MenuID.open);
    expect(menuItem.enabled).toBeTrue();
    menuItem = findMenuItem(MenuID.redo);
    expect(menuItem.enabled).toBeTrue();
    menuEnable(null, { [MenuID.redo]: false });
    menuItem = findMenuItem(MenuID.redo);
    expect(menuItem.enabled).toBeFalse();
  });

  it('has items that respond to click events', () => {
    menuEnable(null, { [MenuID.open]: true });
    const menuItem = findMenuItem(MenuID.open);
    menuItem.click(menuItem);
    expect(mockMenuSelected).toHaveBeenCalledWith(
      Channels.menuSelected,
      menuItem.id
    );
  });
});
