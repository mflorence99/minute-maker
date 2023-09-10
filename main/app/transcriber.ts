import { Channels } from './common';
import { TranscriptionImpl } from './common';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 dynamic channel handlers
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(
  Channels.transcriberCredentials,
  async (
    event,
    credentials: string,
    implementation: TranscriptionImpl
  ): Promise<void> => {
    // 👇 establish credentials
    const handler = (await import(`./transcriber-${implementation}`))
      .credentials;
    handler(event, credentials);
    // 👇 reset the cancel handler
    ipcMain.removeAllListeners(Channels.transcriberCancel);
    ipcMain.handle(
      Channels.transcriberCancel,
      (await import(`./transcriber-${implementation}`)).transcriberCancel
    );
    // 👇 reset the poll handler
    ipcMain.removeAllListeners(Channels.transcriberPoll);
    ipcMain.handle(
      Channels.transcriberPoll,
      (await import(`./transcriber-${implementation}`)).transcriberPoll
    );
    // 👇 reset the transcriber handler
    ipcMain.removeAllListeners(Channels.transcriberRequest);
    ipcMain.handle(
      Channels.transcriberRequest,
      (await import(`./transcriber-${implementation}`)).transcriberRequest
    );
  }
);
