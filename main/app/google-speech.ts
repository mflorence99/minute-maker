import { Channels } from './common';
import { Constants } from './common';
import { TranscriberRequest } from './common';
import { Transcription } from './common';

import { sleep } from './utils';

import { CredentialBody } from 'google-auth-library';

import { ipcMain } from 'electron';
import { readFileSync } from 'fs';
import { v1p1beta1 } from '@google-cloud/speech';

import jsome from 'jsome';

let theCredentials: CredentialBody;

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCancel --> cancelOperation)
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberCancel, cancelOperation);

export async function cancelOperation(
  event,
  transcriptionName: string
): Promise<void> {
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  try {
    jsome([`👉 ${Channels.transcriberCancel}`, transcriptionName]);
    // @ts-ignore 🔥 can't explain why this doesn't match required type
    await client.cancelOperation({ name: transcriptionName });
  } catch (error) {
    console.log(`🔥 ${error.message}`);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCredentials
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberCredentials, credentials);

export function credentials(event, creds: string): void {
  jsome(`👉 ${Channels.transcriberCredentials} ${creds}`);
  theCredentials = JSON.parse(creds.trim());
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberPoll --> longRunningRecognize
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberPoll, checkLongRunningRecognizeProgress);

export async function checkLongRunningRecognizeProgress(
  event,
  transcriptionName: string
): Promise<void> {
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  jsome([`👉 ${Channels.transcriberPoll}`, transcriptionName]);

  do {
    try {
      // 👇 how far along are we?
      const response = await client.checkLongRunningRecognizeProgress(
        transcriptionName
      );

      // 👇 1. metadata doesn't seem to be typed properly
      //    2. seems to be 0% all the way to the end, when it jumps to 100%
      const progressPercent = response.done
        ? 100
        : // @ts-ignore 🔥 metadata doesn't have progressPercent?
          response.metadata.progressPercent ?? 0;
      console.log(`👈 ${Channels.transcriberPoll} ${progressPercent}%`);
      globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
        name: transcriptionName,
        progressPercent,
        transcription: response.done ? makeTranscription(response.result) : null
      });

      // 👇 it's all over
      if (response.done) break;

      // 👇 wait before polling again
      await sleep(Constants.transcriberPollInterval);
    } catch (error) {
      jsome(`🔥 ${error.message}`);
      throw error;
    }
  } while (true);
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberRequest --> longRunningRecognize
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.transcriberRequest, longRunningRecognize);

export async function longRunningRecognize(
  event,
  request: TranscriberRequest
): Promise<string> {
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  jsome([`👉 ${Channels.transcriberRequest}`, request]);

  // 👇 call Google to begin transcription
  // @ts-ignore 🔥 no idea why this stopped compiling
  const [operation] = await client.longRunningRecognize({
    audio: {
      // 👇 content only works for "short" files, otherwise
      //    must use data in GCS bucket
      content: request.audio.fileName
        ? readFileSync(request.audio.fileName).toString('base64')
        : null,
      uri: request.audio.gcsuri
    },
    config: {
      adaptation: {
        phraseSets: [
          {
            phrases: request.phrases.map((phrase) => ({ value: phrase }))
          }
        ]
      },
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      diarizationSpeakerCount: request.numSpeakers,
      enableSpeakerDiarization: true,
      // @ts-ignore 🔥 no access ro Google's encoding
      encoding: request.audio.encoding,
      languageCode: 'en-US',
      model: 'latest_long',
      sampleRateHertz: request.audio.sampleRateHertz
    }
  });

  // 👇 with the name, clients can now poll for comopletion
  return operation.name;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function makeTranscription(result): Transcription[] {
  let end = 0;
  let numWords = 0;
  let speaker = null;
  let start = 0;
  const speech: string[] = [];
  // 👇 we need only look at the last result
  //    https://cloud.google.com/speech-to-text/docs/multiple-voices
  const infos = result.results[result.results.length - 1].alternatives[0].words;
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
