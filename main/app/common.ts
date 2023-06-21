import PACKAGE from '../../package.json';

import { BackoffOptions } from 'exponential-backoff';

import { z } from 'zod';

// 🔥 there are two common.ts, one under main, the other under renderer
//    one of them is a symlink!

export const ENV = {
  package: {
    author: PACKAGE.author,
    name: PACKAGE.name,
    description: PACKAGE.description,
    license: PACKAGE.license,
    repository: {
      type: PACKAGE.repository.type,
      url: PACKAGE.repository.url
    },
    version: PACKAGE.version
  },

  settings: {
    backoffOptions: {
      delayFirstAttempt: true,
      jitter: 'full',
      maxDelay: 30000
    } as BackoffOptions,
    maxRecentPaths: 32,
    openaiDefaults: {
      temperature: 0.5,
      top_p: 1
    },
    saveFileInterval: 10000
  }
};

// 👇 Electron main/renderer channels

export enum Channels {
  dialogShowErrorBox = 'dialog/showErrorBox',

  fsChooseFile = 'fs/chooseFile',
  fsLoadFile = 'fs/loadFile',
  fsOpenFile = 'fs/OpenFile',
  fsSaveFile = 'fs/saveFile',
  fsSaveFileAs = 'fs/saveFileAs',

  localStorageClear = 'local-storage/clear',
  localStorageGetItem = 'local-storage/getItem',
  localStorageRemoveItem = 'local-storage/removeItem',
  localStorageSetItem = 'local-storage/setItem',
  localStorageStore = 'local-storage/store',

  metadataParseFile = 'audio-metadata/parseFile',

  openaiChatCompletion = 'openai/chat-completion',
  openaiCompletion = 'openai/completion',
  openaiListModels = 'openai/list-models',

  transcriberCancel = 'google-speech/transcriber/cancel',
  transcriberRequest = 'google-speech/transcriber/request',
  transcriberResponse = 'google-speech/transcriber/response',

  uploaderRequest = 'google-storage/uploader/request'
}

// 👇 request/response types for above channels

export type AudioMetadata = {
  bitrate: number;
  codec: string;
  duration: number;
  extension: string;
  lossless: boolean;
  numberOfChannels: number;
  sampleRate: number;
};

export type FileFilter = {
  extensions: string[];
  name: string;
};

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

export type OpenDialogOptions = {
  defaultPath?: string;
  filters?: FileFilter[];
  title?: string;
};

export type OpenFileResponse = {
  data: string;
  path: string;
};

export type SaveDialogOptions = OpenDialogOptions;

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

export type TranscriberResponse = {
  name: string;
  progressPercent: number;
  transcription: Transcription[];
};

export type UploaderRequest = {
  bucketName: string;
  destFileName: string;
  filePath: string;
};

export type UploaderResponse = {
  gcsuri: string;
  url: string;
};

// 👇 schema for minutes and their transcription

export const TranscriptionSchema = z.object({
  speaker: z.string(),
  speech: z.string(),
  start: z.number()
});

export const MinutesSchema = z.object({
  audio: z.object({
    gcsuri: z.string().url(),
    url: z.string().url()
  }),
  date: z.coerce.date(),
  subject: z.string(),
  subtitle: z.string(),
  title: z.string(),
  transcription: TranscriptionSchema.array()
});

export type Minutes = z.infer<typeof MinutesSchema>;

export type Transcription = z.infer<typeof TranscriptionSchema>;
