import { Channels } from './common';
import { Constants } from './common';
import { TranscriberRequest } from './common';
import { TranscriberResponse } from './common';
import { Transcription } from './common';

import { sleep } from './utils';

import axios from 'axios';
import jsome from 'jsome';

let theCredentials: string;

const cancellations = new Set<string>();

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCancel --> transcriberCancel)
// //////////////////////////////////////////////////////////////////////////

// 🔥 this doesn't actually cancel a transcription, it just stops the poll
//    for completion to make it appear to be canceled

export function transcriberCancel(event, transcriptionName: string): void {
  jsome([`👉  ASSEMBLYAI ${Channels.transcriberCancel}`, transcriptionName]);
  cancellations.add(transcriptionName);
}

// 🔥 this doesn't work at all -- no way to cancel in API?

export async function transcriberCancelXXX(
  event,
  transcriptionName: string
): Promise<void> {
  jsome([`👉  ASSEMBLYAI ${Channels.transcriberCancel}`, transcriptionName]);
  const response = await axios.delete(
    `${Constants.transcriptionImpls.assemblyai.endpoint}/transcript/${transcriptionName}`,
    {
      headers: {
        Authorization: theCredentials
      }
    }
  );
  jsome([`👈  ASSEMBLYAI ${Channels.transcriberCancel}`, response.data]);
  return response.data.id;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberCredentials
// //////////////////////////////////////////////////////////////////////////

export function credentials(event, credentials: string): void {
  jsome(`👉  ASSEMBLYAI ${Channels.transcriberCredentials} ${credentials}`);
  theCredentials = credentials.trim();
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.transcriberPoll --> transcriberPoll
// //////////////////////////////////////////////////////////////////////////

export async function transcriberPoll(
  event,
  transcriptionName: string
): Promise<void> {
  jsome([`👉  ASSEMBLYAI ${Channels.transcriberPoll}`, transcriptionName]);
  while (true) {
    // 👇 have we been cancelled?
    if (cancellations.has(transcriptionName))
      throw new Error('Transcription cancelled');
    // 👇 how far along are we?
    const response = await axios.get(
      `${Constants.transcriptionImpls.assemblyai.endpoint}/transcript/${transcriptionName}`,
      {
        headers: {
          Authorization: theCredentials
        }
      }
    );
    // 👇 any errors?
    const result = response.data;
    if (result.status === 'error') {
      jsome(`🔥  ${result.error}`);
      throw new Error(result.error);
    }
    // 👇 formulate transcription if done
    const done = result.status === 'completed';
    // 🔥 how to find percent done?
    const progressPercent = done ? 100 : 33;
    jsome(
      `👈 ASSEMBLYAI ${Channels.transcriberPoll} ${progressPercent}% ${
        done ? 'DONE' : ''
      }`
    );
    globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
      name: transcriptionName,
      progressPercent,
      transcription: done ? makeTranscription(result.utterances) : null
    } satisfies TranscriberResponse);
    // 👇 it's all over
    if (done) break;
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
  jsome([`👉  ASSEMBLYAI ${Channels.transcriberRequest}`, request]);
  // 👇 call AssemblyAI to begin transcription
  const response = await axios.post(
    `${Constants.transcriptionImpls.assemblyai.endpoint}/transcript`,
    {
      audio_url: request.audio.url,
      disfluencies: false,
      format_text: true,
      punctuate: true,
      speakers_expected: request.numSpeakers,
      speaker_labels: true,
      word_boost: request.phrases
    },
    {
      headers: {
        'Authorization': theCredentials,
        'Content-Type': 'application/json'
      }
    }
  );
  // 👇 with the ID, clients can now poll for completion
  jsome([`👈  ASSEMBLYAI ${Channels.transcriberRequest}`, response.data.id]);
  return response.data.id;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function makeTranscription(utterances): Transcription[] {
  return utterances.map((utterance) => ({
    end: utterance.end / 1000,
    speaker: `Speaker_${utterance.speaker}`,
    speech: utterance.text,
    start: utterance.start / 1000
  }));
}
