import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { UploaderRequest } from '#mm/common';
import { UploaderResponse } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class UploaderService {
  //

  credentials(credentials: string): Promise<any> {
    return ipc.invoke(Channels.uploaderCredentials, credentials);
  }

  enableCORS(bucketName: string): Promise<void> {
    return ipc.invoke(Channels.uploaderEnableCORS, bucketName);
  }

  upload(request: UploaderRequest): Promise<UploaderResponse> {
    return ipc.invoke(Channels.uploaderRequest, request);
  }
}
