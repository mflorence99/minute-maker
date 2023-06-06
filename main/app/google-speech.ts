import { Channels } from './common';
import { TranscriberCancel } from './common';
import { TranscriberRequest } from './common';
import { TranscriberTranscription } from './common';

import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { v1p1beta1 } from '@google-cloud/speech';

// //////////////////////////////////////////////////////////////////////////
// 🟩 transcription request
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.transcriberRequest, longRunningRecognize);

// 👇 exported for tests
export async function longRunningRecognize(
  event,
  request: TranscriberRequest
): Promise<void> {
  const client = new v1p1beta1.SpeechClient();

  // 👇 call Google to begin transcription
  const [operation] = await client.longRunningRecognize({
    audio: {
      // 👇 audio content not important for tests
      content: request.audio?.fileName
        ? readFileSync(request.audio.fileName).toString('base64')
        : null
    },
    config: {
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      diarizationSpeakerCount: request.speakers.length,
      enableSpeakerDiarization: true,
      encoding: request.audio?.encoding ?? 'MP3',
      languageCode: 'en-US',
      sampleRateHertz: request.audio?.sampleRateHertz ?? 16000
    }
  });

  // 👇 call Google to begin transcription
  const transcriber = operation.promise();
  const poller = pollOperationProgress(client, operation);
  const [[response]] = await Promise.all([transcriber, poller]);

  // 👇 return the transcription to the caller
  globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
    name: operation.name,
    progressPercent: 100,
    transcription: makeTranscription(request, response)
  });
}

// //////////////////////////////////////////////////////////////////////////
// 🟥 cancel transcription
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.transcriberCancel, cancelOperation);

// 👇 exported for tests
export async function cancelOperation(
  event,
  request: TranscriberCancel
): Promise<void> {
  const client = new v1p1beta1.SpeechClient();
  try {
    await client.cancelOperation(request as any);
  } catch (error) {
    console.log(`🔥 ${error.message}`);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function makeTranscription(request, response): TranscriberTranscription[] {
  let speaker = null;
  let start = 0;
  const speech: string[] = [];
  // 👇 we need only look at the last result
  //    https://cloud.google.com/speech-to-text/docs/multiple-voices
  const infos =
    response.results[response.results.length - 1].alternatives[0].words;
  // 👇 add a terminal object
  infos.push({});
  return infos.reduce((transcription, info) => {
    const nextSpeaker = request.speakers[Number(info.speakerTag) - 1];
    if (nextSpeaker !== speaker) {
      if (speaker)
        transcription.push({
          speaker: speaker,
          speech: speech.join(' '),
          start: start
        });
      speaker = nextSpeaker;
      start = Number(info.startTime?.seconds ?? 0);
      speech.length = 0;
    }
    speech.push(info.word);
    return transcription;
  }, []);
}

async function pollOperationProgress(
  client: v1p1beta1.SpeechClient,
  operation
): Promise<void> {
  do {
    // 👇 how far along are we?
    const response = await client.checkLongRunningRecognizeProgress(
      operation.name
    );
    const { latestResponse, metadata } = response;
    if (latestResponse.done) break;
    // 👇 1. metadata doesn't seem to be typed properly
    //    2. seems to be 0% all the way to the end, when it jumps to 100%
    globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
      name: operation.name,
      progressPercent: (<any>metadata).progressPercent,
      speech: null
    });
    // 👇 wait before polling again
    await sleep(1000);
  } while (true);
}

function sleep(ms): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
