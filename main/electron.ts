import * as electron from 'electron';
import * as path from 'path';
import * as url from 'url';

const { app, BrowserWindow } = electron;

app.on('ready', () => {
  const isDev = process.env['DEV_MODE'] === '1';
  const theWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
      scrollBounce: true,
      webSecurity: !isDev
    }
  });
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
    theWindow.webContents.openDevTools();
  } else {
    theWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
  theWindow.setMenu(null);
  // event handlers
  const sendBounds = (): void =>
    theWindow.webContents.send('bounds', theWindow.getBounds());
  theWindow.on('move', sendBounds);
  theWindow.on('resize', sendBounds);
});

app.on('window-all-closed', () => {
  app.quit();
});
