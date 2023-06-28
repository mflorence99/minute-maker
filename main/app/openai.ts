import { Channels } from './common';
import { Constants } from './common';
import { OpenAIRequest } from './common';
import { OpenAIResponse } from './common';

import { BackoffOptions } from 'exponential-backoff';
import { Configuration } from 'openai';
import { OpenAIApi } from 'openai';

import { backOff } from 'exponential-backoff';
import { ipcMain } from 'electron';

import jsome from 'jsome';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiChatCompletion --> chatCompletion
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiChatCompletion, chatCompletion);

// 👇 exported for tests
export async function chatCompletion(
  event,
  _request: OpenAIRequest
): Promise<OpenAIResponse> {
  jsome([`👉 ${Channels.openaiChatCompletion}`, `${trunc(_request.prompt)}`]);
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
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
        openai.createChatCompletion({
          messages: [{ content: prompt, role: 'user' }],
          ...request,
          ...dflt
        }),
      backoffOptions()
    );
    response = {
      finish_reason: _response.data.choices[0].finish_reason as any,
      text: _response.data.choices[0].message.content
    };
  } catch (error) {
    response = { finish_reason: error.message };
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
// 🟩 Channels.openaiCompletion --> completion
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiCompletion, completion);

// 👇 exported for tests
export async function completion(
  event,
  request: OpenAIRequest
): Promise<OpenAIResponse> {
  jsome([`👉 ${Channels.openaiCompletion}`, `${trunc(request.prompt)}`]);
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
  // 👇 these are the request defaults
  const dflt = {
    ...Constants.openaiDefaults,
    max_tokens: 2048,
    model: 'text-davinci-003'
  };
  // 👇 ready to call OpenAI
  let response;
  try {
    const _response = await backOff(
      () =>
        openai.createCompletion({
          ...request,
          ...dflt
        }),
      backoffOptions()
    );
    response = {
      finish_reason: _response.data.choices[0].finish_reason as any,
      text: _response.data.choices[0].text
    };
  } catch (error) {
    response = { finish_reason: error.message };
  }
  // 👇 return synthesized response
  jsome([
    `👈 ${Channels.openaiCompletion}`,
    `${response.finish_reason}`,
    `${trunc(response.text)}`
  ]);
  return response;
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 Channels.openaiListModels --> listModels
// //////////////////////////////////////////////////////////////////////////

ipcMain.handle(Channels.openaiListModels, listModels);

// 👇 exported for tests
export async function listModels(): Promise<string[]> {
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
  // 👇 ready to call OpenAI
  jsome(`👉 ${Channels.openaiListModels}`);
  const response = await openai.listModels();
  const models = response.data.data.map((data) => data.id).sort();
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

function trunc(text: string, maxlen = 100): string {
  return text.length < maxlen ? text : `${text.substring(0, maxlen)}...`;
}
