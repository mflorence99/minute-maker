import { Channels } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { Storage } from '@google-cloud/storage';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 upload request
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.uploaderRequest, upload);

// 👇 exported for tests
export async function upload(
  event,
  request: UploaderRequest
): Promise<UploaderResponse> {
  const storage = new Storage();
  const options = {
    destination: request.destFileName
  };
  console.log(`👉 ${Channels.uploaderRequest} ${JSON.stringify(request)}`);
  await storage.bucket(request.bucketName).upload(request.filePath, options);
  const response = {
    gcsuri: `gs://${request.bucketName}/${request.destFileName}`
  };
  console.log(`👈 ${Channels.uploaderRequest} ${JSON.stringify(response)}`);
  return response;
}
