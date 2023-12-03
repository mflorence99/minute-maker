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

const openaiChatCompletionDefaults: Partial<OpenAIChatCompletionRequest> = {
  top_p: 1
};

const openaiImageGenerationDefaults: Partial<
  Record<OpenAIModel, Partial<OpenAIImageGenerationRequest>>
> = {
  'dall-e-2': {
    n: 4,
    response_format: 'b64_json',
    size: '512x512'
  },
  'dall-e-3': {
    n: 1,
    quality: 'hd',
    response_format: 'b64_json',
    size: '1024x1024',
    style: 'vivid'
  }
};

const openaiModels: Record<OpenAIModel, string> = {
  'dall-e-2': 'DALL-E 2',
  'dall-e-3': 'DALL-E 3',
  'gpt-3.5-turbo-16k': 'GPT 3.5',
  'gpt-4': 'GPT 4',
  'gpt-4-turbo': 'GPT 4',
  'gpt-4-1106-preview': 'GPT 4'
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
    description: `AssemblyAI Transcript`,
    link: 'https://www.assemblyai.com/docs/',
    transcriptionRate: 5 // 👈 x real time
  },
  google: {
    description: `Google Speech-to-text`,
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
  openaiChatCompletionDefaults,
  openaiImageGenerationDefaults,
  openaiModels,
  rephraseStrategy,
  saveFileThrottleInterval: 2000,
  sentryDSN:
    'https://c4cd041a16584464b8c0f6b2c984b516@o918490.ingest.sentry.io/5861734',
  speakerPfx: 'Speaker_',
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
  badges = 'menu/badges',
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
  openaiImageGeneration = 'openai/image-generation',
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

export type OpenAIModel =
  | 'dall-e-2'
  | 'dall-e-3'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4-1106-preview';

export type OpenAIChatCompletionRequest = {
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  top_p?: number;
};

export type OpenAIChatCompletionResponse = {
  finish_reason: 'length' | 'stop'; // 👈 actual error if anything else
  text: string;
};

export type OpenAIImageGenerationRequest = {
  model?: OpenAIModel;
  n?: number;
  prompt: string;
  quality?: 'hd';
  response_format?: 'b64_json' | 'url';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'natural' | 'vivid';
};

export type OpenAIImageGenerationResponse = {
  b64_json: string[];
  error: string;
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
    url: z.string().url(),
    // 👇 duration of waveform
    wavelength: z.number().optional()
  }),
  badgeNum: z.number(),
  badges: z.string().array(),
  date: z.coerce.date().nullable(),
  findReplace: FindReplaceSchema.optional(),
  hideSpeakerUpdateDialog: z.boolean(),
  nextTranscriptionID: z.number(),
  numSpeakers: z.number(),
  organization: z.string(),
  present: z.string().array(),
  speakerUpdateButton: z.number(),
  subject: z.string(),
  summary: SummarySchema.array(),
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
  badgeNum: 0,
  badges: [],
  date: null,
  findReplace: {},
  hideSpeakerUpdateDialog: false,
  nextTranscriptionID: 0,
  numSpeakers: 1,
  organization: '',
  present: [],
  speakerUpdateButton: 1,
  subject: '',
  summary: [],
  transcription: [],
  visitors: []
});
