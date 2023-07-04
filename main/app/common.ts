import PACKAGE from '../../package.json';

import { BackoffOptions } from 'exponential-backoff';

import { z } from 'zod';

// 🕥 there are two common.ts, one under main, the other under renderer
//    one of them is a symlink!

// //////////////////////////////////////////////////////////////////////////
// 🟪 package details
// //////////////////////////////////////////////////////////////////////////

export const Package = {
  author: PACKAGE.author,
  name: PACKAGE.name,
  description: PACKAGE.description,
  license: PACKAGE.license,
  repository: {
    type: PACKAGE.repository.type,
    url: PACKAGE.repository.url
  },
  version: PACKAGE.version
};

// //////////////////////////////////////////////////////////////////////////
// 🟧 settings NOT expected to be configured by user
// //////////////////////////////////////////////////////////////////////////

const backoffOptions: BackoffOptions = {
  delayFirstAttempt: true,
  jitter: 'full',
  maxDelay: 30000
};

// 👇 all this so we can access the strategy at runtime eg: in UI
export const rephraseStrategies = ['brevity', 'accuracy'] as const;
export type RephraseStrategy = (typeof rephraseStrategies)[number];
const rephraseStrategy: RephraseStrategy = 'accuracy';

// 👇 all this so we can access the strategy at runtime eg: in UI
export const summaryStrategies = ['bullets', 'paragraphs'] as const;
export type SummaryStrategy = (typeof summaryStrategies)[number];
const summaryStrategy: SummaryStrategy = 'paragraphs';

export const Constants = {
  backoffOptions,
  maxRecentPaths: 32,
  maxUndoStackDepth: 7,
  openaiDefaults: {
    temperature: 0.5,
    top_p: 1
  },
  rephraseStrategy,
  saveFileInterval: 10000,
  sentryDSN:
    'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
  summaryStrategy,
  transcriptionPollInterval: 10000,
  updateBufferDebounceTime: 1000
};

// //////////////////////////////////////////////////////////////////////////
// 🟩 Electron main/renderer channels
// //////////////////////////////////////////////////////////////////////////

export enum Channels {
  appBeforeQuit = 'app/beforeQuit',
  appQuit = 'app/quit',

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

  uploaderEnableCORS = 'google-storage/uploader/enableCORS',
  uploaderRequest = 'google-storage/uploader/request'
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 request/response types for above channels
// //////////////////////////////////////////////////////////////////////////

export type AudioMetadata = {
  bitrate: number;
  codec: string;
  duration: number;
  encoding: string;
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
    encoding: any; // 👈 yes really -- no access to Google's encoding
    fileName?: string;
    gcsuri?: string;
    sampleRateHertz: number;
  };
  numSpeakers: number;
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

// //////////////////////////////////////////////////////////////////////////
// 🟥 zod-validated schema for minutes and their transcription
// //////////////////////////////////////////////////////////////////////////

export const AgendaItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.literal('AG')
});

export const AttendeeSchema = z.object({
  name: z.string(),
  title: z.string()
});

export const SummarySchema = z.object({
  section: z.string(),
  summary: z.string()
});

export const TranscriptionSchema = z.object({
  id: z.number(),
  speaker: z.string(),
  speech: z.string(),
  start: z.number().optional(),
  type: z.literal('TX')
});

export const MinutesSchema = z.object({
  absent: AttendeeSchema.array().optional(),
  audio: z.object({
    encoding: z.string(),
    gcsuri: z.string().url(),
    sampleRateHertz: z.number(),
    url: z.string().url()
  }),
  date: z.coerce.date().optional(),
  nextTranscriptionID: z.number().optional(),
  numSpeakers: z.number().optional(),
  present: AttendeeSchema.array().optional(),
  subject: z.string().optional(),
  subtitle: z.string().optional(),
  summary: SummarySchema.array().optional(),
  summaryStrategy: z.enum(summaryStrategies).optional(),
  title: z.string(),
  transcription: z
    .discriminatedUnion('type', [AgendaItemSchema, TranscriptionSchema])
    .array()
    .optional(),
  visitors: AttendeeSchema.array().optional()
});

export type AgendaItem = z.infer<typeof AgendaItemSchema>;

export type Minutes = z.infer<typeof MinutesSchema>;

export type Summary = z.infer<typeof SummarySchema>;

export type Transcription = z.infer<typeof TranscriptionSchema>;
