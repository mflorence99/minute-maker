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

export function menuSelected(x, y): any {
  return (menuItem): void => {
    if (itemsEnabled[menuItem.id])
      globalThis.theWindow.webContents.send(
        Channels.menuSelected,
        menuItem.id,
        menuItem.data,
        x,
        y
      );
  };
}

// //////////////////////////////////////////////////////////////////////////
// 🟪 ContextMenu configuration
// //////////////////////////////////////////////////////////////////////////

ContextMenu({
  prepend: (actions, params, window: BrowserWindow) => {
    const clicker = menuSelected(params.x, params.y);
    return [
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
        click: clicker,
        enabled: itemsEnabled[MenuID.undo],
        icon: tuiSVGtoPNGfromCache('tuiIconCornerUpLeft'),
        id: MenuID.undo,
        label: 'Undo'
      },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.redo],
        icon: tuiSVGtoPNGfromCache('tuiIconCornerUpRight'),
        id: MenuID.redo,
        label: 'Redo'
      },
      { type: 'separator' },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.rephraseAccuracy],
        id: MenuID.rephraseAccuracy,
        label: 'Rephrase for Accuracy'
      },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.rephraseBrevity],
        id: MenuID.rephraseBrevity,
        label: 'Rephrase for Brevity'
      },
      { type: 'separator' },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.insert],
        id: MenuID.insert,
        label: 'Insert Agenda Item Above'
      },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.remove],
        id: MenuID.remove,
        label: 'Remove Agenda Item'
      },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.split],
        id: MenuID.split,
        label: 'Split Transcription at Cursor'
      },
      {
        click: clicker,
        enabled: itemsEnabled[MenuID.join],
        id: MenuID.join,
        label: 'Join to next Transcription'
      }
    ];
  },
  showSelectAll: false
});
