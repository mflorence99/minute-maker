import { Channels } from './common';
import { MenuID } from './common';

import { tuiSVGtoPNGfromCache } from './utils';

import { BrowserWindow } from 'electron';

import { ipcMain } from 'electron';

import ContextMenu from 'electron-context-menu';
import isDev from 'electron-is-dev';

const itemsEnabled: Record<string, boolean> = {};

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.menuEnable / menuSelected
// //////////////////////////////////////////////////////////////////////////

ipcMain.on(Channels.menuEnable, menuEnable);

export function menuEnable(event, settings: Record<string, boolean>): void {
  Object.keys(settings).forEach((id) => (itemsEnabled[id] = settings[id]));
}

export function menuSelected(menuItem): void {
  if (itemsEnabled[menuItem.id]) {
    globalThis.theWindow.webContents.send(Channels.menuSelected, menuItem.id);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟪 ContextMenu configuration
// //////////////////////////////////////////////////////////////////////////

ContextMenu({
  prepend: (actions, params, window: BrowserWindow) => [
    {
      click: (): void => window.webContents.reload(),
      icon: tuiSVGtoPNGfromCache('tuiIconRefreshCw'),
      label: 'Reload',
      visible: isDev
    },
    {
      click: (): void => window.webContents.toggleDevTools(),
      icon: tuiSVGtoPNGfromCache('tuiIconTool'),
      label: 'Toggle Developer Tools',
      visible: isDev
    },
    { type: 'separator' },
    {
      click: menuSelected,
      enabled: itemsEnabled[MenuID.undo],
      icon: tuiSVGtoPNGfromCache('tuiIconCornerUpLeft'),
      id: MenuID.undo,
      label: 'Undo'
    },
    {
      click: menuSelected,
      enabled: itemsEnabled[MenuID.redo],
      icon: tuiSVGtoPNGfromCache('tuiIconCornerUpRight'),
      id: MenuID.redo,
      label: 'Redo'
    }
  ]
});
