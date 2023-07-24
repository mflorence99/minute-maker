import { Channels } from './common';
import { Constants } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { Storage } from '@google-cloud/storage';

import { ipcMain } from 'electron';

import jsome from 'jsome';

let theCredentials: string;

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderCredentials
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.uploaderCredentials, credentials);

export function credentials(event, creds: string): void {
  theCredentials = creds;
  jsome(`👉 ${Channels.uploaderCredentials} ${theCredentials}`);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderRequest --> upload
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.uploaderRequest, upload);

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
// 🟩 Channels.uploaderEnableCORS --> enableCORS
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.uploaderEnableCORS, enableCORS);

export async function enableCORS(event, bucketName: string): Promise<any> {
  const storage = new Storage();
  jsome([`👉 ${Channels.uploaderEnableCORS}`, bucketName]);
  await storage.bucket(bucketName).setCorsConfiguration(Constants.corsOptions);
  const [metadata] = await storage.bucket(bucketName).getMetadata();
  jsome([`👈 ${Channels.uploaderEnableCORS}`, metadata.cors]);
  return metadata;
}
