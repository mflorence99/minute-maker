import { Channels } from './common';
import { MenuID } from './common';
import { SubmenuItem } from './common';

import { tuiSVGtoPNG } from './utils';

import { Menu } from 'electron';
import { MenuItem } from 'electron';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.menuEnable / menuSelected
// //////////////////////////////////////////////////////////////////////////

ipcMain.on(Channels.menuEnable, menuEnable);

export function menuEnable(
  event,
  settings: Record<string, boolean | SubmenuItem[]>
): void {
  Object.entries(settings).forEach(([id, submenu]) => {
    const menuItem = findMenuItem(id);
    if (menuItem) {
      menuItem.enabled = !!submenu;
      // 👇 try to modify the submenu, if one existed in the template
      if (Array.isArray(submenu) && menuItem.submenu) {
        // 🔥 clear doesn't work for some reason, so we only append
        //    SubmenuItems not already present
        // menuItem.submenu.clear();
        const present = new Set(
          menuItem.submenu.items.map((item) => item.label)
        );
        submenu
          .filter((item) => !present.has(item.label))
          .forEach((item) =>
            menuItem.submenu.append(
              new MenuItem({ ...item, click: menuSelected })
            )
          );
      }
    }
  });
}

export function menuSelected(menuItem): void {
  if (menuItem.enabled)
    globalThis.theWindow.webContents.send(
      Channels.menuSelected,
      menuItem.id,
      menuItem.data
    );
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
        label: 'New Minutes from MP3 Audio...'
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
      {
        enabled: false,
        id: MenuID.recents,
        label: 'Recent Minutes...',
        submenu: []
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
    label: 'Run',
    submenu: [
      {
        click: menuSelected,
        enabled: false,
        id: MenuID.transcribe,
        label: 'Transcribe Audio'
      },
      {
        click: menuSelected,
        enabled: false,
        id: MenuID.summarizeBullets,
        label: 'Summarize Transcription into Bullet Points'
      },
      {
        click: menuSelected,
        enabled: false,
        id: MenuID.summarizeParagraphs,
        label: 'Summarize Transcription into Paragraphs'
      }
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
