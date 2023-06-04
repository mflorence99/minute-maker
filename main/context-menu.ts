import { BrowserWindow } from 'electron';

import ContextMenu from 'electron-context-menu';
import isDev from 'electron-is-dev';

// 👇 context menu
ContextMenu({
  prepend: (dflt, params, window: BrowserWindow) => [
    {
      click: (): void => window.webContents.toggleDevTools(),
      label: 'Toggle dev tools',
      visible: isDev
    },
    {
      click: (): void => window.webContents.reload(),
      label: 'Reload the app',
      visible: isDev
    }
  ]
});
