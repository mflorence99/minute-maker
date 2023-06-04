import { TranscriptionContext } from '#app/common';

import { ipcMain } from 'electron';
import { v1p1beta1 } from '@google-cloud/speech';

import jsome from 'jsome';

ipcMain.on(
  'google-speech/transcriber',
  (event, context: TranscriptionContext) => {
    new v1p1beta1.SpeechClient();
    jsome(context.title);
  }
);
