export enum Channels {
  localStorageClear = 'local-storage/clear',
  localStorageGetItem = 'local-storage/getItem',
  localStorageRemoveItem = 'local-storage/removeItem',
  localStorageSetItem = 'local-storage/setItem',

  openaiChatCompletion = 'openai/chat-completion',
  openaiCompletion = 'openai/completion',
  openaiListModels = 'openai/list-models',

  transcriberCancel = 'google-speech/transcriber/cancel',
  transcriberRequest = 'google-speech/transcriber/request',
  transcriberResponse = 'google-speech/transcriber/response',

  uploaderRequest = 'google-storage/uploader/request'
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
    fileName?: string;
    gcsuri?: string;
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
  transcription: Transcription[];
}

export type Transcription = {
  speaker: string;
  speech: string;
  start: number;
};

export type UploaderRequest = {
  bucketName: string;
  destFileName: string;
  filePath: string;
};

export type UploaderResponse = {
  gcsuri: string;
};
