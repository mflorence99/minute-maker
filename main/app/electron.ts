import './audio-metadata';
import './context-menu';
import './dialog';
import './fs';
import './google-speech';
import './google-storage';
import './openai';

import { store } from './local-storage';

import { BrowserWindow } from 'electron';
import { Rectangle } from 'electron';

import { app } from 'electron';
import { format } from 'url';
import { join } from 'path';

import isDev from 'electron-is-dev';

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
  // 👇 configure the window
  theWindow.setMenu(null);
});

app.on('window-all-closed', () => {
  app.quit();
});
