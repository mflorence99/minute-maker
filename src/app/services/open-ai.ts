import { environment } from '../environment';

import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Configuration } from 'openai';
import { Injectable } from '@angular/core';
import { OpenAIApi } from 'openai';

export type CreateChatCompletionRequest = {
  max_tokens?: number;
  messages: [{ content: string; role: ChatCompletionRequestMessageRoleEnum }];
  model?: string;
  temperature?: number;
  top_p?: number;
};

export type CreateCompletionRequest = {
  max_tokens?: number;
  model?: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
};

export type CreateChatCompletionResponse = {
  content: string;
  finish_reason: 'length' | 'stop';
};

export type CreateCompletionResponse = {
  finish_reason: 'length' | 'stop';
  text: string;
};

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  #openai: OpenAIApi;

  constructor() {
    this.#openai = new OpenAIApi(
      new Configuration({
        // 🔥 HACK to get right API key for live and test
        apiKey: environment.env.OPEN_AI_KEY ?? process.env['OPEN_AI_KEY']
      })
    );
  }

  async createChatCompletion(
    request: CreateChatCompletionRequest
  ): Promise<CreateChatCompletionResponse> {
    const dflt = {
      max_tokens: 2048,
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      top_p: 1
    };
    const response = await this.#openai.createChatCompletion({
      ...request,
      ...dflt
    });
    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason as any
    };
  }

  async createCompletion(
    request: CreateCompletionRequest
  ): Promise<CreateCompletionResponse> {
    const dflt = {
      max_tokens: 2048,
      model: 'text-davinci-003',
      temperature: 0.5,
      top_p: 1
    };
    const response = await this.#openai.createCompletion({
      ...request,
      ...dflt
    });
    return {
      finish_reason: response.data.choices[0].finish_reason as any,
      text: response.data.choices[0].text
    };
  }

  async listModels(): Promise<string[]> {
    const response = await this.#openai.listModels();
    return response.data.data.map((data) => data.id).sort();
  }
}
