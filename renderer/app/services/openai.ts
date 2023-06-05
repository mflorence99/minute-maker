import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { OpenAIRequest } from '#mm/common';
import { OpenAIResponse } from '#mm/common';

// 🔥 to avoid webpack errors
const ipcRenderer = window.require('electron').ipcRenderer;

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  chatCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    return ipcRenderer.invoke(Channels.openaiChatCompletion, request);
  }

  completion(request: OpenAIRequest): Promise<OpenAIResponse> {
    return ipcRenderer.invoke(Channels.openaiCompletion, request);
  }

  listModels(): Promise<string[]> {
    return ipcRenderer.invoke(Channels.openaiListModels);
  }
}
