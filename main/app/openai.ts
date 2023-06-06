import { Channels } from './common';
import { OpenAIRequest } from './common';
import { OpenAIResponse } from './common';

import { Configuration } from 'openai';
import { OpenAIApi } from 'openai';

import { ipcMain } from 'electron';

// //////////////////////////////////////////////////////////////////////////
// 🟩 chatCompletion request
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.openaiChatCompletion, chatCompletion);

// 👇 exported for tests
export async function chatCompletion(
  event,
  _request: OpenAIRequest
): Promise<OpenAIResponse> {
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
  // 👇 these are the request defaults
  const dflt = {
    max_tokens: 2048,
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    top_p: 1
  };
  // 👇 simplify the API to look the same as "completion"
  const { prompt, ...request } = _request;
  // 👇 ready to call OpenAI
  const response = await openai.createChatCompletion({
    messages: [{ content: prompt, role: 'user' }],
    ...request,
    ...dflt
  });
  // 👇 just extract the important bits
  return {
    finish_reason: response.data.choices[0].finish_reason as any,
    text: response.data.choices[0].message.content
  };
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 completion request
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.openaiCompletion, completion);

// 👇 exported for tests
export async function completion(
  event,
  request: OpenAIRequest
): Promise<OpenAIResponse> {
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
  // 👇 these are the request defaults
  const dflt = {
    max_tokens: 2048,
    model: 'text-davinci-003',
    temperature: 0.5,
    top_p: 1
  };
  // 👇 ready to call OpenAI
  const response = await openai.createCompletion({
    ...request,
    ...dflt
  });
  // 👇 just extract the important bits
  return {
    finish_reason: response.data.choices[0].finish_reason as any,
    text: response.data.choices[0].text
  };
}

// //////////////////////////////////////////////////////////////////////////
// 🟩 listModels request
// //////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-misused-promises
ipcMain.on(Channels.openaiListModels, listModels);

// 👇 exported for tests
export async function listModels(): Promise<string[]> {
  // 👇 create the OpenAI client
  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env['OPEN_AI_KEY']
    })
  );
  // 👇 ready to call OpenAI
  const response = await openai.listModels();
  return response.data.data.map((data) => data.id).sort();
}
