import { Channels } from './common';
import { Constants } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { CredentialBody } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';

import jsome from 'jsome';

let theCredentials: CredentialBody;

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderCredentials
// //////////////////////////////////////////////////////////////////////////

export function credentials(event, credentials: string): void {
  jsome(`👉  GOOGLE ${Channels.uploaderCredentials} ${credentials}`);
  theCredentials = JSON.parse(credentials.trim());
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderRequest --> uploaderRequest
// //////////////////////////////////////////////////////////////////////////

export async function uploaderRequest(
  event,
  request: UploaderRequest
): Promise<UploaderResponse> {
  jsome([`👉  GOOGLE ${Channels.uploaderRequest}`, request]);
  const storage = new Storage({ credentials: theCredentials });
  const options = {
    destination: request.destFileName
  };
  await storage.bucket(request.bucketName).upload(request.filePath, options);
  const response = {
    gcsuri: `gs://${request.bucketName}/${request.destFileName}`,
    url: `https://storage.googleapis.com/${request.bucketName}/${request.destFileName}`
  };
  jsome([`👈  GOOGLE ${Channels.uploaderRequest}`, response]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderEnableCORS --> uploaderEnableCORS
// //////////////////////////////////////////////////////////////////////////

export async function uploaderEnableCORS(
  event,
  bucketName: string
): Promise<any> {
  const storage = new Storage({ credentials: theCredentials });
  jsome([`👉  GOOGLE ${Channels.uploaderEnableCORS}`, bucketName]);
  await storage.bucket(bucketName).setCorsConfiguration(Constants.corsOptions);
  const [metadata] = await storage.bucket(bucketName).getMetadata();
  jsome([`👈  GOOGLE ${Channels.uploaderEnableCORS}`, metadata.cors]);
  return metadata;
}
