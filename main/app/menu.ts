import { Channels } from './common';
import { MenuID } from './common';

import { tuiSVGtoPNG } from './utils';

import { Menu } from 'electron';
import { MenuItem } from 'electron';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.menuEnable / menuSelected
// //////////////////////////////////////////////////////////////////////////

ipcMain.on(Channels.menuEnable, menuEnable);

export function menuEnable(event, settings: Record<string, boolean>): void {
  Object.entries(settings).forEach(([id, enabled]) => {
    const menuItem = findMenuItem(id);
    if (menuItem) menuItem.enabled = enabled;
  });
}

export function menuSelected(menuItem): void {
  if (menuItem.enabled)
    globalThis.theWindow.webContents.send(Channels.menuSelected, menuItem.id);
}

// //////////////////////////////////////////////////////////////////////////
// 🟪 Electron menu template
// //////////////////////////////////////////////////////////////////////////

export const menuTemplate = [
  {
    label: 'Minutes',
    submenu: [
      {
        accelerator: 'CmdOrCtrl+O',
        click: menuSelected,
        enabled: false,
        id: MenuID.open,
        label: 'Open Minutes JSON File'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        accelerator: 'CmdOrCtrl+Z',
        click: menuSelected,
        enabled: false,
        icon: tuiSVGtoPNG('tuiIconCornerUpLeft'),
        id: MenuID.undo,
        label: 'Undo'
      },
      {
        accelerator: 'CmdOrCtrl+Y',
        click: menuSelected,
        enabled: false,
        icon: tuiSVGtoPNG('tuiIconCornerUpRight'),
        id: MenuID.redo,
        label: 'Redo'
      },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { icon: tuiSVGtoPNG('tuiIconRefreshCw'), role: 'reload' },
      { role: 'forceReload' },
      { icon: tuiSVGtoPNG('tuiIconTool'), role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'close' }]
  }
];

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

export function findMenuItem(
  id: string,
  menu = Menu.getApplicationMenu()
): MenuItem {
  // 👇 this hack makes testing work: we either pass in the real
  //    Electron menu OR the template that created it
  for (const menuItem of (menu.items ?? menu) as MenuItem[]) {
    if (menuItem.id === id) return menuItem;
    if (menuItem.submenu) {
      const found = findMenuItem(id, menuItem.submenu);
      if (found) return found;
    }
  }
  return null;
}
