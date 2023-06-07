import { Channels } from './common';
import { UploaderRequest } from './common';

import { Storage } from '@google-cloud/storage';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 upload request
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.uploaderRequest, upload);

// 👇 exported for tests
export async function upload(event, request: UploaderRequest): Promise<void> {
  const storage = new Storage();
  const options = {
    destination: request.destFileName
  };
  // 🙈 https://github.com/googleapis/nodejs-storage/blob/main/samples/uploadFile.js
  await storage.bucket(request.bucketName).upload(request.filePath, options);
}
