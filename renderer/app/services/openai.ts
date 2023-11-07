import { Channels } from '#mm/common';
import { Injectable } from '@angular/core';
import { OpenAIChatCompletionRequest } from '#mm/common';
import { OpenAIChatCompletionResponse } from '#mm/common';
import { OpenAIImageGenerationRequest } from '#mm/common';
import { OpenAIImageGenerationResponse } from '#mm/common';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  //

  chatCompletion(
    request: OpenAIChatCompletionRequest
  ): Promise<OpenAIChatCompletionResponse> {
    return ipc.invoke(Channels.openaiChatCompletion, request);
  }

  credentials(credentials: string): Promise<any> {
    return ipc.invoke(Channels.openaiCredentials, credentials);
  }

  imageGeneration(
    request: OpenAIImageGenerationRequest
  ): Promise<OpenAIImageGenerationResponse> {
    return ipc.invoke(Channels.openaiImageGeneration, request);
  }

  listModels(): Promise<string[]> {
    return ipc.invoke(Channels.openaiListModels);
  }
}
