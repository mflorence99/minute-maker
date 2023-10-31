import { Channels } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { AssemblyAI } from 'assemblyai';

import jsome from 'jsome';

let theCredentials: string;

// 🔥 we can't currently use this uploader as the AssemblyAI CDN only
//    works within AssemblyAI code -- so we are using Google's instead

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderCredentials
// //////////////////////////////////////////////////////////////////////////

export function credentials(event, credentials: string): void {
  jsome(`👉  ASSEMBLYAI ${Channels.uploaderCredentials} ${credentials}`);
  theCredentials = credentials.trim();
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderRequest --> uploaderRequest
// //////////////////////////////////////////////////////////////////////////

export async function uploaderRequest(
  event,
  request: UploaderRequest
): Promise<UploaderResponse> {
  jsome([`👉  ASSEMBLYAI ${Channels.uploaderRequest}`, request]);
  const client = new AssemblyAI({ apiKey: theCredentials });
  const response = await client.files.upload(request.filePath);
  jsome([`👈  ASSEMBLY ${Channels.uploaderRequest}`, response]);
  return {
    gcsuri: '', // 👈 not used
    url: response
  };
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderEnableCORS --> NOT USED
// //////////////////////////////////////////////////////////////////////////

export function uploaderEnableCORS(): void {}
