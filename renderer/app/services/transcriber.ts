import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranscriberRequest } from '#mm/common';
import { TranscriberResponse } from '#mm/common';

// 🔥 to avoid webpack errors
const ipcRenderer = window.require('electron').ipcRenderer;

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  transcribe(request: TranscriberRequest): Observable<TranscriberResponse> {
    return new Observable((observer) => {
      ipcRenderer.on(Channels.transcriberResponse, (event, response) => {
        observer.next(response);
        if (response.progressPercent === 100) observer.complete();
      });
      ipcRenderer.send(Channels.transcriberRequest, request);
    });
  }
}
