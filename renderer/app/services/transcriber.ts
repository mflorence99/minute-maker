import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranscriberRequest } from '#mm/common';
import { TranscriberResponse } from '#mm/common';
import { TranscriptionImpl } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  //

  cancelTranscription(transcriptionName: string): Promise<void> {
    return ipc.invoke(Channels.transcriberCancel, transcriptionName);
  }

  credentials(
    credentials: string,
    implementation: TranscriptionImpl
  ): Promise<void> {
    return ipc.invoke(
      Channels.transcriberCredentials,
      credentials,
      implementation
    );
  }

  pollTranscription(
    transcriptionName: string
  ): Observable<TranscriberResponse> {
    // 👇 create a stream that polls for completion
    return new Observable((observer) => {
      // 👇 listen for transcriber responses
      function listener(event, response): void {
        observer.next(response);
        if (response.progressPercent === 100) observer.complete();
      }
      ipc.on(Channels.transcriberResponse, listener);
      // 👇 poll for transcription complete
      ipc
        .invoke(Channels.transcriberPoll, transcriptionName)
        .catch((error) => observer.error(error));
      // 👇 teardown logic
      return () => ipc.removeListener(Channels.transcriberResponse, listener);
    });
  }

  async startTranscription(request: TranscriberRequest): Promise<string> {
    return await ipc.invoke(Channels.transcriberRequest, request);
  }
}
