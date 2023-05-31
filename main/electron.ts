import * as path from 'path';
import * as url from 'url';

import { BrowserWindow } from 'electron';
import { Rectangle } from 'electron';

import { app } from 'electron';

import ContextMenu from 'electron-context-menu';
import Store from 'electron-store';

const isDev = process.env['DEV_MODE'] === '1';

// 👇 local config storage
const store = new Store({
  name: isDev ? 'config.dev' : 'config.prod'
});

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

app.on('ready', () => {
  // 👇 get the last-used window bounds
  const bounds = store.get('theWindow.bounds', {
    height: 600,
    width: 800,
    x: undefined,
    y: undefined
  }) as Rectangle;
  // 👇 the one and only window
  const theWindow = new BrowserWindow({
    height: bounds.height,
    resizable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
      scrollBounce: true,
      spellcheck: true,
      webSecurity: true
    },
    width: bounds.width,
    x: bounds.x,
    y: bounds.y
  });
  // 👇 load from Angular's dev server in dev mode
  if (isDev) {
    theWindow.loadURL(
      url.format({
        hostname: 'localhost',
        pathname: path.join(),
        port: 4200,
        protocol: 'http:',
        query: { isDev: true },
        slashes: true
      })
    );
  }
  // 👇 load from compiled build id prod mode
  else {
    theWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
  // 👇 save the window bounds when they change
  const setBounds = (): void =>
    store.set('theWindow.bounds', theWindow.getBounds());
  theWindow.on('move', setBounds);
  theWindow.on('resize', setBounds);
  // 👇 configure the window
  theWindow.setMenu(null);
});

app.on('window-all-closed', () => {
  app.quit();
});
