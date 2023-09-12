import './_jsome';
import './audio-metadata';
import './context-menu';
import './dialog';
import './fs';
import './menu';
import './openai';
import './transcriber';
import './uploader';

import { Channels } from './common';
import { Constants } from './common';
import { Package } from './common';

import { menuTemplate } from './menu';
import { resolveAllPromises } from './utils';
import { store } from './local-storage';

import * as Sentry from '@sentry/node';

import { BrowserWindow } from 'electron';
import { Menu } from 'electron';
import { Rectangle } from 'electron';

import { app } from 'electron';
import { format } from 'url';
import { ipcMain } from 'electron';
import { join } from 'path';

import isDev from 'electron-is-dev';
import jsome from 'jsome';

// 👇 log the environment
if (isDev) {
  jsome({ Package: { ...Package } });
  jsome({ Constants: { ...Constants } });
}

// 👉 initialize Sentry.io
if (!isDev) {
  Sentry.init({
    debug: true,
    dsn: Constants.sentryDSN,
    release: `Minute Maker v${Package.version}`
  });
}

// 👇 ready to rock!

app.on('ready', async () => {
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
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
      sandbox: true,
      scrollBounce: true,
      spellcheck: true,
      webSecurity: true
    },
    width: bounds.width,
    x: bounds.x,
    y: bounds.y
  });

  // 👇 configure the menu
  const resolved = await resolveAllPromises(menuTemplate);
  const menu = Menu.buildFromTemplate(resolved);
  Menu.setApplicationMenu(menu);

  // 👇 load from Angular's dev server in dev mode
  if (isDev) {
    theWindow.loadURL(
      format({
        hostname: 'localhost',
        pathname: join(),
        port: 4200,
        protocol: 'http:',
        query: { isDev: true },
        slashes: true
      })
    );
    theWindow.webContents.openDevTools();
  }

  // 👇 load from compiled build id prod mode
  else {
    theWindow.loadURL(
      format({
        pathname: join(__dirname, '..', 'renderer', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // 👇 everyone needs to see this
  globalThis.theWindow = theWindow;

  // 👇 save the window bounds when they change
  const setBounds = (): void =>
    store.set('theWindow.bounds', theWindow.getBounds());
  theWindow.on('move', setBounds);
  theWindow.on('resize', setBounds);

  // 👇 perform quit actions
  ipcMain.on(Channels.appQuit, () => {
    jsome('🔥  ... exit');
    app.exit();
  });

  globalThis.theWindow.on('close', (event) => {
    jsome('🔥  Exiting ...');
    event.preventDefault();
    globalThis.theWindow.webContents.send(Channels.appBeforeQuit);
  });
});
