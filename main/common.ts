export enum Channels {
  transcriberCancel = '@google-speech/transcriber/cancel',
  transcriberRequest = '@google-speech/transcriber/request',
  transcriberResponse = '@google-speech/transcriber/response'
}

export type OpenAIRequest = {
  max_tokens?: number;
  model?: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
};

export type OpenAIResponse = {
  finish_reason: 'length' | 'stop';
  text: string;
};

export type TranscriberCancel = {
  name: string;
};

export type TranscriberRequest = {
  audio: {
    encoding: any;
    fileName: string;
    sampleRateHertz: number;
  };
  date: string;
  speakers: string[];
  subject: string;
  subtitle: string;
  title: string;
};

export interface TranscriberResponse {
  name: string;
  progressPercent: number;
  transcription: TranscriberTranscription[];
}

export type TranscriberTranscription = {
  speaker: string;
  speech: string;
  start: number;
};
