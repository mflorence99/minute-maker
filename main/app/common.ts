import PACKAGE from '../../package.json';

import { BackoffOptions } from 'exponential-backoff';
import { Cors } from '@google-cloud/storage/build/cjs/src/storage';

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

const openaiModels: Record<OpenAIModel, string> = {
  'gpt-3.5-turbo-16k': 'GPT 3.5',
  'gpt-4': 'GPT 4'
};

// 👇 all this so we can access the strategy at runtime eg: in UI
export const rephraseStrategies = ['brevity', 'accuracy'] as const;
export type RephraseStrategy = (typeof rephraseStrategies)[number];
const rephraseStrategy: RephraseStrategy = 'accuracy';

// 👇 all this so we can access the strategy at runtime eg: in UI
export const summaryStrategies = ['bullets', 'paragraphs'] as const;
export type SummaryStrategy = (typeof summaryStrategies)[number];
const summaryStrategy: SummaryStrategy = 'paragraphs';

export type TranscriptionImpl = 'assemblyai' | 'google';

export type TranscriptionTech = {
  description: string;
  link: string;
  transcriptionRate: number;
};

const transcriptionImpls: Record<TranscriptionImpl, TranscriptionTech> = {
  assemblyai: {
    description: `AssemblyAI's Transcript`,
    link: 'https://www.assemblyai.com/docs/',
    transcriptionRate: 5 // 👈 x real time
  },
  google: {
    description: `Google's Speech-to-text`,
    link: 'https://cloud.google.com/speech-to-text/docs/how-to',
    transcriptionRate: 2 // 👈 x real time
  }
};

export const Constants = {
  backoffOptions,
  corsOptions,
  maxRecentPaths: 32,
  maxSpeechWords: 250,
  maxUndoStackDepth: 7,
  openaiDefaults: {
    temperature: 0.5,
    top_p: 1
  },
  openaiModels,
  rephraseStrategy,
  saveFileThrottleInterval: 1000,
  sentryDSN:
    'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
  summaryStrategy,
  throttledEventInterval: 1500,
  timeupdateThrottleInterval: 250,
  transcriberPollInterval: 10000,
  transcriptionImpls
};

// //////////////////////////////////////////////////////////////////////////
// 🟩 Electron menu IDs
// //////////////////////////////////////////////////////////////////////////

export enum MenuID {
  close = 'menu/close',
  export = 'menu/export',
  find = 'menu/find',
  insert = 'menu/insert',
  join = 'menu/join',
  new = 'menu/new',
  open = 'menu/open',
  recents = 'menu/recents',
  redo = 'menu/redo',
  remove = 'menu/remove',
  rephraseAccuracy = 'menu/rephrase/accuracy',
  rephraseBrevity = 'menu/rephrase/brevity',
  replace = 'menu/replace',
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
  openaiCredentials = 'openai/credentials',
  openaiListModels = 'openai/list-models',

  transcriberCancel = 'transcriber/cancel',
  transcriberCredentials = 'transcriber/credentials',
  transcriberPoll = 'transcriber/poll',
  transcriberRequest = 'transcriber/request',
  transcriberResponse = 'transcriber/response',

  uploaderCredentials = 'uploader/credentials',
  uploaderEnableCORS = 'uploader/enableCORS',
  uploaderRequest = 'uploader/request'
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
  checkboxLabel?: string;
  detail?: string;
  message: string;
  title?: string;
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
};

export type MessageBoxReply = {
  checkboxChecked: boolean;
  response: number;
};

export type OpenAIModel = 'gpt-3.5-turbo-16k' | 'gpt-4';

export type OpenAIRequest = {
  model: OpenAIModel;
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

export type TranscriberRequest = {
  audio: {
    encoding: string;
    gcsuri: string;
    sampleRateHertz: number;
    url: string;
  };
  numSpeakers: number;
  phrases: string[];
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

export const FindReplaceSchema = z.object({
  doFind: z.boolean().optional(),
  searchString: z.string().optional(),
  withReplace: z.boolean().optional()
});

export const SummarySchema = z.object({
  section: z.string(),
  summary: z.string()
});

export const TranscriptionSchema = z.object({
  end: z.number(),
  id: z.number(),
  speaker: z.string(),
  speech: z.string(),
  start: z.number(),
  type: z.literal('TX')
});

export const MinutesSchema = z.object({
  absent: z.string().array(),
  audio: z.object({
    duration: z.number(),
    encoding: z.string(),
    gcsuri: z.string().url(),
    sampleRateHertz: z.number(),
    url: z.string().url()
  }),
  date: z.coerce.date(),
  findReplace: FindReplaceSchema.optional(),
  hideSpeakerUpdateDialog: z.boolean().optional(),
  nextTranscriptionID: z.number(),
  numSpeakers: z.number(),
  present: z.string().array(),
  speakerUpdateButton: z.number().optional(),
  subject: z.string(),
  subtitle: z.string(),
  summary: SummarySchema.array(),
  title: z.string(),
  transcription: z
    .discriminatedUnion('type', [AgendaItemSchema, TranscriptionSchema])
    .array(),
  transcriptionName: z.string().nullable().optional(),
  transcriptionStart: z.coerce.date().nullable().optional(),
  visitors: z.string().array()
});

export type AgendaItem = z.infer<typeof AgendaItemSchema>;

export type FindReplace = z.infer<typeof FindReplaceSchema>;

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
  findReplace: {},
  hideSpeakerUpdateDialog: false,
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
