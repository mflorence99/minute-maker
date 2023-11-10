import { Channels } from './common';
import { Constants } from './common';
import { TranscriberRequest } from './common';
import { TranscriberResponse } from './common';
import { Transcription } from './common';

import { sleep } from './utils';

import { AssemblyAI } from 'assemblyai';

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
  const client = new AssemblyAI({ apiKey: theCredentials });
  await client.transcripts.delete(transcriptionName);
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
  const client = new AssemblyAI({ apiKey: theCredentials });
  while (true) {
    // 👇 have we been cancelled?
    if (cancellations.has(transcriptionName))
      throw new Error('Transcription cancelled');
    // 👇 how far along are we?
    const transcript = await client.transcripts.get(transcriptionName);
    // 👇 formulate transcription if done
    const done = transcript.status === 'completed';
    const error = transcript.status === 'error';
    // 🔥 how to find percent done?
    const progressPercent = done ? 100 : 33;
    jsome(
      `👈 ASSEMBLYAI ${Channels.transcriberPoll} ${progressPercent}% ${
        done || error ? 'DONE' : ''
      }`
    );
    globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
      name: transcriptionName,
      progressPercent,
      transcription: done ? makeTranscription(transcript.utterances) : null
    } satisfies TranscriberResponse);
    // 👇 it's all over
    if (done || error) break;
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
  const client = new AssemblyAI({ apiKey: theCredentials });
  // 👇 call AssemblyAI to begin transcription
  const transcript = await client.transcripts.create(
    {
      audio_url: request.audio.url,
      disfluencies: false,
      format_text: true,
      punctuate: true,
      speakers_expected: request.numSpeakers,
      speaker_labels: true,
      // 👇 phrases can't be empty
      word_boost: request.phrases.filter((phrase) => !!phrase)
    },
    // 👇 We'll do our own polling, thank you!
    { poll: false }
  );
  // 👇 with the ID, clients can now poll for completion
  jsome([`👈  ASSEMBLYAI ${Channels.transcriberRequest}`, transcript.id]);
  return transcript.id;
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
