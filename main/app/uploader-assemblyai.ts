import { Channels } from './common';
import { Constants } from './common';
import { UploaderRequest } from './common';
import { UploaderResponse } from './common';

import { readFile } from 'fs/promises';

import axios from 'axios';
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
  // 👁️ https://www.assemblyai.com/docs/Guides/transcribing_an_audio_file
  const data = await readFile(request.filePath);
  const _response = await axios.post(
    `${Constants.transcriptionImpls.assemblyai.endpoint}/upload`,
    data,
    {
      headers: {
        'Authorization': theCredentials,
        'Content-Type': 'application/octet-stream'
      }
    }
  );
  if (_response.status === 200) {
    const response = {
      gcsuri: '', // 👈 not used
      url: _response.data.upload_url
    };
    jsome([`👈  ASSEMBLY ${Channels.uploaderRequest}`, response]);
    return response;
  } else {
    jsome(`🔥  ${_response.statusText}`);
    throw new Error(_response.statusText);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.uploaderEnableCORS --> NOT USED
// //////////////////////////////////////////////////////////////////////////

export function uploaderEnableCORS(): void {}
