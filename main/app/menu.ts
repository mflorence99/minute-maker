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
    label: 'File',
    submenu: [
      {
        accelerator: 'CmdOrCtrl+N',
        click: menuSelected,
        enabled: true,
        id: MenuID.new,
        label: 'New Minutes from MP3 File...'
      },
      { type: 'separator' },
      {
        accelerator: 'CmdOrCtrl+O',
        click: menuSelected,
        enabled: true,
        icon: tuiSVGtoPNG('tuiIconBookOpen'),
        id: MenuID.open,
        label: 'Open Minutes JSON File...'
      },
      { type: 'separator' },
      {
        accelerator: 'CmdOrCtrl+S',
        click: menuSelected,
        enabled: false,
        icon: tuiSVGtoPNG('tuiIconSave'),
        id: MenuID.save,
        label: 'Save Minutes'
      },
      {
        accelerator: 'CmdOrCtrl+Shift+S',
        click: menuSelected,
        enabled: false,
        id: MenuID.saveAs,
        label: 'Save Minutes As...'
      },
      {
        click: menuSelected,
        enabled: false,
        icon: tuiSVGtoPNG('tuiIconCode'),
        id: MenuID.export,
        label: 'Export Minutes As HTML...'
      },
      { type: 'separator' },
      {
        click: menuSelected,
        enabled: false,
        id: MenuID.close,
        label: 'Close Minutes'
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
