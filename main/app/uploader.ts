import { Channels } from './common';
import { TranscriptionImpl } from './common';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 dynamic channel handlers
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(
  Channels.uploaderCredentials,
  async (
    event,
    credentials: string,
    implementation: TranscriptionImpl
  ): Promise<void> => {
    // 👇 establish credentials
    const handler = (await import(`./uploader-${implementation}`)).credentials;
    handler(event, credentials);
    // 👇 reset the uploader handler
    ipcMain.removeHandler(Channels.uploaderRequest);
    ipcMain.handle(
      Channels.uploaderRequest,
      (await import(`./uploader-${implementation}`)).uploaderRequest
    );
    // 👇 reset the enableCORS handler
    ipcMain.removeHandler(Channels.uploaderEnableCORS);
    ipcMain.handle(
      Channels.uploaderEnableCORS,
      (await import(`./uploader-${implementation}`)).uploaderEnableCORS
    );
  }
);
