import { Channels } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { Storage } from '@google-cloud/storage';

import { ipcMain } from 'electron';

import jsome from 'jsome';

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
  jsome([`👉 ${Channels.uploaderRequest}`, request]);
  await storage.bucket(request.bucketName).upload(request.filePath, options);
  const response = {
    gcsuri: `gs://${request.bucketName}/${request.destFileName}`,
    url: `https://storage.googleapis.com/${request.bucketName}/${request.destFileName}`
  };
  jsome([`👈 ${Channels.uploaderRequest}`, response]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 enable CORS for bucket
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.uploaderEnableCORS, enableCORS);

// 👇 exported for tests
export async function enableCORS(event, bucketName: string): Promise<void> {
  const storage = new Storage();
  const cors = {
    maxAgeSeconds: 3600,
    method: ['GET'],
    origin: ['*'],
    responseHeader: ['Content-Type']
  };
  jsome([`👉 ${Channels.uploaderEnableCORS}`, bucketName]);
  await storage.bucket(bucketName).setCorsConfiguration([cors]);
  const [metadata] = await storage.bucket(bucketName).getMetadata();
  jsome([`👈 ${Channels.uploaderEnableCORS}`, metadata.cors]);
}
