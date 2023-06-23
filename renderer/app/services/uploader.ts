import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { UploaderRequest } from '#mm/common';
import { UploaderResponse } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

// https://storage.googleapis.com/washington-app-319514.appspot.com/minutes.mp3

@Injectable({ providedIn: 'root' })
export class UploaderService {
  //

  enableCORS(bucketName: string): Promise<void> {
    return ipc.invoke(Channels.uploaderEnableCORS, bucketName);
  }

  upload(request: UploaderRequest): Promise<UploaderResponse> {
    return ipc.invoke(Channels.uploaderRequest, request);
  }
}
