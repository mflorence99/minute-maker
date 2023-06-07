import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranscriberCancel } from '#mm/common';
import { TranscriberRequest } from '#mm/common';
import { TranscriberResponse } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 🔥 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  // 👇 cancel transcription
  cancelTranscription(request: TranscriberCancel): void {
    ipc.send(Channels.transcriberCancel, request);
  }

  // 👇 perform transcription
  transcribe(request: TranscriberRequest): Observable<TranscriberResponse> {
    return new Observable((observer) => {
      let name;
      function listener(event, response): void {
        name = response.name;
        observer.next(response);
        if (response.progressPercent === 100) observer.complete();
      }
      ipc.on(Channels.transcriberResponse, listener);
      ipc.send(Channels.transcriberRequest, request);
      // 👇 teardown logic
      return () => {
        ipc.send(Channels.transcriberCancel, { name });
        ipc.removeListener(Channels.transcriberResponse, listener);
      };
    });
  }
}
