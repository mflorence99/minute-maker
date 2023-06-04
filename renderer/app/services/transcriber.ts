import { Injectable } from '@angular/core';
import { TranscriptionContext } from '#app/common';

// 🔥 to avoid webpack errors
const ipcRenderer = window.require('electron').ipcRenderer;

@Injectable({ providedIn: 'root' })
export class TranscriberService {
  transcribe(context: TranscriptionContext): void {
    ipcRenderer.send('google-speech/transcriber', context);
  }
}
