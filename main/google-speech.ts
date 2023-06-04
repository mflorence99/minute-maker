import { Channels } from './common';
import { TranscriberRequest } from './common';
import { TranscriberTranscription } from './common';

import { ipcMain } from 'electron';
import { v1p1beta1 } from '@google-cloud/speech';

import jsome from 'jsome';

ipcMain.on(
  Channels.transcriberRequest,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (event, request: TranscriberRequest): Promise<void> => {
    const client = new v1p1beta1.SpeechClient();

    // 👇 call Google to begin transcription
    const [operation] = await client.longRunningRecognize({
      audio: {
        uri: request.audio.gcsuri
      },
      config: {
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        diarizationSpeakerCount: request.speakers.length,
        enableSpeakerDiarization: true,
        encoding: request.audio.encoding,
        languageCode: 'en-US',
        sampleRateHertz: request.audio.sampleRateHertz
      }
    });

    // 👇 call Google to begin transcription
    const transcriber = operation.promise();
    const poller = pollOperationProgress(client, operation);
    const [[response]] = await Promise.all([transcriber, poller]);

    // 👇 we need only look at the last result
    //    https://cloud.google.com/speech-to-text/docs/multiple-voices

    let currentSpeakerTag = null;
    let currentStartTime = null;
    const currentSpeech: string[] = [];
    const transcription: TranscriberTranscription[] = [];
    const wordsInfo =
      response.results[response.results.length - 1].alternatives[0].words;

    // 👇 iterate over all the words
    wordsInfo.forEach((info) => {
      jsome(info);
      const speakerTag = request.speakers[Number(info.speakerTag) - 1];
      if (speakerTag !== currentSpeakerTag) {
        if (currentSpeakerTag)
          transcription.push({
            speaker: currentSpeakerTag,
            speech: currentSpeech.join(' '),
            start: currentStartTime
          });
        currentSpeakerTag = speakerTag;
        currentStartTime = null;
        currentSpeech.length = 0;
      }
      if (!currentStartTime)
        currentStartTime = Number(info.startTime.seconds ?? 0);
      currentSpeech.push(info.word);
    });

    // 👇 don't forget the last one!
    transcription.push({
      speaker: currentSpeakerTag,
      speech: currentSpeech.join(' '),
      start: currentStartTime
    });

    // 👇 return the transcription to the caller
    globalThis.theWindow.webContents.send(Channels.transcriberResponse, {
      progressPercent: 100,
      transcription
    });
  }
);

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
