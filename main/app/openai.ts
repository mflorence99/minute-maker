import { Channels } from './common';
import { Constants } from './common';
import { OpenAIChatCompletionRequest } from './common';
import { OpenAIChatCompletionResponse } from './common';
import { OpenAIImageGenerationRequest } from './common';
import { OpenAIImageGenerationResponse } from './common';

import { trunc } from './utils';

import { BackoffOptions } from 'exponential-backoff';

import { backOff } from 'exponential-backoff';
import { ipcMain } from 'electron';

import jsome from 'jsome';
import OpenAI from 'openai';

let theCredentials: string;

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiChatCompletion --> chatCompletion
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiChatCompletion, chatCompletion);

export async function chatCompletion(
  event,
  _request: OpenAIChatCompletionRequest
): Promise<OpenAIChatCompletionResponse> {
  jsome([
    `👉  ${Channels.openaiChatCompletion}`,
    _request.model,
    trunc(_request.prompt)
  ]);
  // 👇 create the OpenAI client
  const openai = new OpenAI({
    apiKey: theCredentials
  });
  // 👇 ready to call OpenAI
  const { prompt, ...request } = _request;
  let response: OpenAIChatCompletionResponse;
  try {
    const _response = await backOff(
      () =>
        openai.chat.completions.create({
          messages: [{ content: prompt, role: 'user' }],
          ...Constants.openaiChatCompletionDefaults,
          ...request
        }),
      backoffOptions()
    );
    response = {
      finish_reason: _response.choices[0].finish_reason as any,
      text: _response.choices[0].message.content
    };
  } catch (error) {
    response = { finish_reason: error.message, text: '' };
  }
  // 👇 return synthesized response
  jsome([
    `👈 ${Channels.openaiChatCompletion}`,
    response.finish_reason,
    trunc(response.text)
  ]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiCredentials
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiCredentials, credentials);

export function credentials(event, credentials: string): void {
  jsome([`👉  ${Channels.openaiCredentials}`, credentials]);
  theCredentials = credentials.trim();
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiImageGeneration
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiImageGeneration, imageGeneration);

export async function imageGeneration(
  event,
  request: OpenAIImageGenerationRequest
): Promise<OpenAIImageGenerationResponse> {
  jsome([
    `👉  ${Channels.openaiImageGeneration}`,
    request.model,
    trunc(request.prompt)
  ]);
  // 👇 create the OpenAI client
  const openai = new OpenAI({
    apiKey: theCredentials
  });
  // 👇 ready to call OpenAI
  let response: OpenAIImageGenerationResponse;
  try {
    const _response = await backOff(
      () =>
        // @ts-ignore 🔥 type not properly defined for dall-e-3
        openai.images.generate({
          ...Constants.openaiImageGenerationDefaults,
          ...request
        }),
      backoffOptions()
    );
    response = { b64_json: _response.data[0].b64_json, error: '' };
  } catch (error) {
    response = { b64_json: '', error: error.message };
  }
  // 👇 return synthesized response
  jsome([
    `👈 ${Channels.openaiImageGeneration}`,
    response.error,
    trunc(response.b64_json)
  ]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiListModels --> listModels
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiListModels, listModels);

export async function listModels(): Promise<string[]> {
  // 👇 create the OpenAI client
  const openai = new OpenAI({
    apiKey: theCredentials
  });
  // 👇 ready to call OpenAI
  jsome(`👉  ${Channels.openaiListModels}`);
  const response = await openai.models.list();
  const models = response.data.map((data) => data.id).sort();
  jsome([`👈  ${Channels.openaiListModels}`, models]);
  return models;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function backoffOptions(): BackoffOptions {
  return {
    ...Constants.backoffOptions,
    retry: (error): boolean => {
      jsome(`🔥  ${error.message}`, error);
      // 🙈 https://help.openai.com/en/articles/5955604-how-can-i-solve-429-too-many-requests-errors
      return /(rate limit)|(too many)/i.test(error.message);
    }
  };
}
