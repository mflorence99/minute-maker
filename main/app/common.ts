import PACKAGE from '../../package.json';

import { BackoffOptions } from 'exponential-backoff';
import { Cors } from '@google-cloud/storage/build/src/storage';

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

const corsOptions: Cors[] = [
  {
    maxAgeSeconds: 3600,
    method: ['GET'],
    origin: ['*'],
    responseHeader: ['Content-Type']
  }
];

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
  corsOptions,
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
// 🟩 Electron menu IDs
// //////////////////////////////////////////////////////////////////////////

export enum MenuID {
  close = 'menu/close',
  export = 'menu/export',
  insert = 'menu/insert',
  join = 'menu/join',
  new = 'menu/new',
  open = 'menu/open',
  recents = 'menu/recents',
  redo = 'menu/redo',
  remove = 'menu/remove',
  rephraseAccuracy = 'menu/rephrase/accuracy',
  rephraseBrevity = 'menu/rephrase/brevity',
  save = 'menu/save',
  saveAs = 'menu/saveAs',
  split = 'menu/split',
  summarizeBullets = 'menu/summarize/bullets',
  summarizeParagraphs = 'menu/summarize/paragraphs',
  transcribe = 'menu/transcribe',
  undo = 'menu/undo'
}

// 👆 when one of the above has a dynamic submenu

export type SubmenuItem = {
  data: string;
  id: MenuID;
  label: string;
};

// //////////////////////////////////////////////////////////////////////////
// 🟩 Electron main/renderer channels
// //////////////////////////////////////////////////////////////////////////

export enum Channels {
  appBeforeQuit = 'app/beforeQuit',
  appQuit = 'app/quit',

  dialogShowErrorBox = 'dialog/showErrorBox',
  dialogShowMessageBox = 'dialog/showMessageBox',

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

  menuEnable = 'menu/enable',
  menuSelected = 'menu/selected',

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

export type MessageBoxOptions = {
  buttons: string[];
  message: string;
  title?: string;
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
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
  absent: z.string().array().optional(),
  audio: z.object({
    encoding: z.string(),
    gcsuri: z.string().url(),
    sampleRateHertz: z.number(),
    url: z.string().url()
  }),
  date: z.coerce.date(),
  nextTranscriptionID: z.number().optional(),
  numSpeakers: z.number().optional(),
  present: z.string().array().optional(),
  subject: z.string().optional(),
  subtitle: z.string().optional(),
  summary: SummarySchema.array().optional(),
  title: z.string(),
  transcription: z
    .discriminatedUnion('type', [AgendaItemSchema, TranscriptionSchema])
    .array()
    .optional(),
  visitors: z.string().array().optional()
});

export type AgendaItem = z.infer<typeof AgendaItemSchema>;

export type Minutes = z.infer<typeof MinutesSchema>;

export type Summary = z.infer<typeof SummarySchema>;

export type Transcription = z.infer<typeof TranscriptionSchema>;

// //////////////////////////////////////////////////////////////////////////
// 🔳 create default, empty newMinutes
// //////////////////////////////////////////////////////////////////////////

export const emptyMinutes = (): Minutes => ({
  absent: [],
  audio: {},
  date: new Date(),
  nextTranscriptionID: 0,
  numSpeakers: 1,
  present: [],
  subject: '',
  subtitle: '',
  summary: [],
  title: '',
  transcription: [],
  visitors: []
});
