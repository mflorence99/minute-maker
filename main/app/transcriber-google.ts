import { Channels } from './common';
import { Constants } from './common';
import { TranscriberRequest } from './common';
import { TranscriberResponse } from './common';
import { Transcription } from './common';

import { sleep } from './utils';

import { CredentialBody } from 'google-auth-library';

import { v1p1beta1 } from '@google-cloud/speech';

import jsome from 'jsome';

let theCredentials: CredentialBody;

const cancellations = new Set<string>();

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCancel --> transcriberCancel)
// //////////////////////////////////////////////////////////////////////////

// 🔥 this doesn't actually cancel a transcription, it just stops the poll
//    for completion to make it appear to be canceled

export function transcriberCancel(event, transcriptionName: string): void {
  jsome([`👉  GOOGLE ${Channels.transcriberCancel}`, transcriptionName]);
  cancellations.add(transcriptionName);
}

// 🔥 this doesn't work at all -- no way to cancel in API?

export async function transcriberCancelXXX(
  event,
  transcriptionName: string
): Promise<void> {
  jsome([`👉  GOOGLE ${Channels.transcriberCancel}`, transcriptionName]);
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  // @ts-ignore 🔥 can't explain why this doesn't match required type
  await client.cancelOperation({ name: transcriptionName });
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCredentials
// //////////////////////////////////////////////////////////////////////////

export function credentials(event, credentials: string): void {
  jsome(`👉  GOOGLE ${Channels.transcriberCredentials} ${credentials}`);
  theCredentials = JSON.parse(credentials.trim());
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberPoll --> transcriberPoll
// //////////////////////////////////////////////////////////////////////////

export async function transcriberPoll(
  event,
  transcriptionName: string
): Promise<void> {
  jsome([`👉  GOOGLE ${Channels.transcriberPoll}`, transcriptionName]);
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  while (true) {
    // 👇 have we been cancelled?
    if (cancellations.has(transcriptionName))
      throw new Error('Transcription cancelled');
    // 👇 how far along are we?
    const response =
      await client.checkLongRunningRecognizeProgress(transcriptionName);
    // 👇 1. metadata doesn't seem to be typed properly
    //    2. seems to be 0% all the way to the end, when it jumps to 100%
    const progressPercent = response.done
      ? 100
      : // @ts-ignore 🔥 metadata doesn't have progressPercent?
        response.metadata.progressPercent ?? 0;
    jsome(
      `👈 GOOGLE ${Channels.transcriberPoll} ${progressPercent}% ${
        response.done ? 'DONE' : ''
      }`
    );
    globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
      name: transcriptionName,
      progressPercent,
      transcription: response.done ? makeTranscription(response.result) : null
    } satisfies TranscriberResponse);
    // 👇 it's all over
    if (response.done) break;
    // 👇 wait before polling again
    await sleep(Constants.transcriberPollInterval);
  }
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberRequest --> transcriberRequest
// //////////////////////////////////////////////////////////////////////////

export async function transcriberRequest(
  event,
  request: TranscriberRequest
): Promise<string> {
  jsome([`👉  GOOGLE ${Channels.transcriberRequest}`, request]);
  const client = new v1p1beta1.SpeechClient({ credentials: theCredentials });
  // 👇 call Google to begin transcription
  // @ts-ignore 🔥 no idea why this stopped compiling
  const [operation] = await client.longRunningRecognize({
    audio: {
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
      // @ts-ignore 🔥 no access to Google's encoding
      encoding: request.audio.encoding,
      languageCode: 'en-US',
      model: 'latest_long',
      sampleRateHertz: request.audio.sampleRateHertz
    }
  });
  // 👇 with the name, clients can now poll for completion
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
    const nextSpeaker = `Speaker_${info.speakerTag}`;
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
