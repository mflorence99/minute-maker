import { z } from 'zod';

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

  openaiChatCompletion = 'openai/chat-completion',
  openaiCompletion = 'openai/completion',
  openaiListModels = 'openai/list-models',

  transcriberCancel = 'google-speech/transcriber/cancel',
  transcriberRequest = 'google-speech/transcriber/request',
  transcriberResponse = 'google-speech/transcriber/response',

  uploaderRequest = 'google-storage/uploader/request'
}

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
  subject: z.string(),
  subtitle: z.string(),
  title: z.string(),
  transcription: TranscriptionSchema.array()
});

export type Minutes = z.infer<typeof MinutesSchema>;

export type Transcription = z.infer<typeof TranscriptionSchema>;

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
