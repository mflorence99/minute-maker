import { Channels } from './common';
import { Constants } from './common';
import { OpenAIRequest } from './common';
import { OpenAIResponse } from './common';

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
  _request: OpenAIRequest
): Promise<OpenAIResponse> {
  jsome([`👉 ${Channels.openaiChatCompletion}`, `${trunc(_request.prompt)}`]);
  // 👇 create the OpenAI client
  const openai = new OpenAI({
    apiKey: theCredentials
  });
  // 👇 these are the request defaults
  const dflt = {
    ...Constants.openaiDefaults,
    model: 'gpt-3.5-turbo-16k'
  };
  // 👇 simplify the API to look the same as "completion"
  const { prompt, ...request } = _request;
  // 👇 ready to call OpenAI
  let response;
  try {
    const _response = await backOff(
      () =>
        openai.chat.completions.create({
          messages: [{ content: prompt, role: 'user' }],
          ...request,
          ...dflt
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
    `${response.finish_reason}`,
    `${trunc(response.text)}`
  ]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiCredentials
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiCredentials, credentials);

export function credentials(event, credentials: string): void {
  theCredentials = credentials;
  jsome(`👉 ${Channels.openaiCredentials} ${theCredentials}`);
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
  jsome(`👉 ${Channels.openaiListModels}`);
  const response = await openai.models.list();
  const models = response.data.map((data) => data.id).sort();
  jsome([`👈 ${Channels.openaiListModels}`, models]);
  return models;
}

// //////////////////////////////////////////////////////////////////////////
// 🟦 helper functions
// //////////////////////////////////////////////////////////////////////////

function backoffOptions(): BackoffOptions {
  return {
    ...Constants.backoffOptions,
    retry: (error): boolean => {
      jsome(`🔥 ${error.message}`, error);
      // 🙈 https://help.openai.com/en/articles/5955604-how-can-i-solve-429-too-many-requests-errors
      return /(rate limit)|(too many)/i.test(error.message);
    }
  };
}
