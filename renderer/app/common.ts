export enum Channels {
  transcriberRequest = '@google-speech/transcriber/request',
  transcriberResponse = '@google-speech/transcriber/response'
}

export type TranscriberRequest = {
  audio: {
    encoding: any;
    gcsuri: string;
    sampleRateHertz: number;
  };
  date: string;
  speakers: string[];
  subject: string;
  subtitle: string;
  title: string;
};

export interface TranscriberResponse {
  progressPercent: number;
  transcription: TranscriberTranscription[];
}

export type TranscriberTranscription = {
  speaker: string;
  speech: string;
  start: number;
};
