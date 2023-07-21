import { Channels } from './common';
import { Constants } from './common';
import { TranscriberCancel } from './common';
import { TranscriberRequest } from './common';
import { Transcription } from './common';

import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { v1p1beta1 } from '@google-cloud/speech';

import jsome from 'jsome';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberRequest --> longRunningRecognize
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberRequest, longRunningRecognize);

// 👇 exported for tests
export async function longRunningRecognize(
  event,
  request: TranscriberRequest
): Promise<void> {
  const client = new v1p1beta1.SpeechClient();
  jsome([`👉 ${Channels.transcriberRequest}`, request]);

  // 👇 call Google to begin transcription
  const [operation] = await client.longRunningRecognize({
    audio: {
      // 👇 content only works for "short" files, otherwise
      //    must use data in GCS bucket
      content: request.audio?.fileName
        ? readFileSync(request.audio.fileName).toString('base64')
        : null,
      uri: request.audio?.gcsuri
    },
    config: {
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      diarizationSpeakerCount: request.numSpeakers || 1,
      enableSpeakerDiarization: true,
      encoding: request.audio?.encoding ?? 'MP3',
      languageCode: 'en-US',
      model: 'latest_long',
      sampleRateHertz: request.audio?.sampleRateHertz ?? 16000
    }
  });

  // 👇 call Google to begin transcription
  const transcriber = operation.promise();
  const poller = pollOperationProgress(client, operation);
  const [[response]] = await Promise.all([transcriber, poller]);

  jsome(`👈 ${Channels.transcriberResponse} 100%`);

  // 👇 return the transcription to the caller
  globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
    name: operation.name,
    progressPercent: 100,
    transcription: makeTranscription(request, response)
  });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCancel --> cancelOperation)
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberCancel, cancelOperation);

// 👇 exported for tests
export async function cancelOperation(
  event,
  request: TranscriberCancel
): Promise<void> {
  const client = new v1p1beta1.SpeechClient();
  try {
    jsome([`👉 ${Channels.transcriberCancel}`, request]);
    await client.cancelOperation(request as any);
  } catch (error) {
    console.log(`🔥 ${error.message}`);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function makeTranscription(request, response): Transcription[] {
  let end = 0;
  let numWords = 0;
  let speaker = null;
  let start = 0;
  const speech: string[] = [];
  // 👇 we need only look at the last result
  //    https://cloud.google.com/speech-to-text/docs/multiple-voices
  const infos =
    response.results[response.results.length - 1].alternatives[0].words;
  // 👇 add a terminal object so we don't have to worry about the last info
  infos.push({});
  // 👇 now coalesce all the words by speaker
  return infos.reduce((transcription, info) => {
    const nextSpeaker = `Speaker ${info.speakerTag}`;
    // 👇 emit speech on change of speaker or if speech exceeds maxima
    if (nextSpeaker !== speaker || numWords >= Constants.maxSpeechWords) {
      if (speaker)
        transcription.push({
          end,
          speaker,
          speech: speech.join(' '),
          start
        });
      numWords = 0;
      speaker = nextSpeaker;
      start = Number(info.startTime?.seconds ?? 0);
      speech.length = 0;
    }
    // 👇 deal with the current word
    numWords += 1;
    speech.push(info.word);
    end = Number(info.endTime?.seconds ?? 0);
    return transcription;
  }, []);
}

async function pollOperationProgress(
  client: v1p1beta1.SpeechClient,
  operation
): Promise<void> {
  do {
    try {
      // 👇 how far along are we?
      const response = await client.checkLongRunningRecognizeProgress(
        operation.name
      );
      const { latestResponse, metadata } = response;
      if (latestResponse.done) break;
      // 👇 1. metadata doesn't seem to be typed properly
      //    2. seems to be 0% all the way to the end, when it jumps to 100%
      const progressPercent = (<any>metadata).progressPercent ?? 0;
      console.log(`👈 ${Channels.transcriberResponse} ${progressPercent}%`);
      globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
        name: operation.name,
        progressPercent,
        speech: null
      });
      // 👇 wait before polling again
      await sleep(Constants.transcriptionPollInterval);
    } catch (error) {
      jsome(`🔥 ${error.message}`);
      break;
    }
  } while (true);
}

function sleep(ms): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
