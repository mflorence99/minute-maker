import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { OpenAIRequest } from '#mm/common';
import { OpenAIResponse } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  chatCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    return ipc.invoke(Channels.openaiChatCompletion, request);
  }

  completion(request: OpenAIRequest): Promise<OpenAIResponse> {
    return ipc.invoke(Channels.openaiCompletion, request);
  }

  listModels(): Promise<string[]> {
    return ipc.invoke(Channels.openaiListModels);
  }
}
